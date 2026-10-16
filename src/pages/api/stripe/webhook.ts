import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres unique_violation: this checkout was already recorded by an earlier delivery.
const UNIQUE_VIOLATION = '23505';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig || !webhookSecret) {
        return res.status(400).send('Webhook signature is missing.');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed: ${errorMessage}`);
        return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const { user_id, gamepool_id, quantity, product, email, username, round_duration, last_score, price_premium, referred_by } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (session.payment_status !== 'paid') {
            console.log('Ignoring checkout.session.completed that is not paid yet:', session.id, session.payment_status);
            return res.status(200).json({ received: true });
        }

        if (!user_id) {
            console.error('Webhook received checkout.session.completed with missing user_id metadata.', { metadata: session.metadata });
            return res.status(400).json({ error: 'Required user_id metadata is missing.' });
        }

        // Parse quantity from metadata (default to 1 if not provided)
        const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
            console.error('Invalid quantity in checkout metadata:', { sessionId: session.id, quantity });
            return res.status(400).json({ error: 'Invalid quantity metadata.' });
        }

        console.log('Processing successful payment:', { 
            user_id, 
            gamepool_id,
            product,
            quantity: parsedQuantity,
            sessionId: session.id,
            paymentIntentId,
            email,
            username,
            referred_by
        });

        try {
            // Check if this is a Four Unders membership payment
            if (product === 'four_unders_membership' && email && username) {
                console.log('Processing Four Unders membership payment');

                // Generate unique referral code for this member (8 characters)
                const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

                // Create waitlist entry with survey data
                const { error: waitlistError } = await supabaseAdmin
                    .from('four_unders_waitlist')
                    .insert({
                        email,
                        username,
                        round_duration,
                        last_score,
                        price_premium,
                        paid: true,
                        stripe_checkout_id: session.id,
                        stripe_payment_intent_id: paymentIntentId,
                        amount_paid: session.amount_total ? session.amount_total / 100 : 50,
                        referred_by: referred_by || null,
                        referral_code: referralCode
                    });

                if (waitlistError?.code === UNIQUE_VIOLATION) {
                    console.log('Four Unders membership already recorded for checkout:', session.id);
                } else if (waitlistError) {
                    // Fail so Stripe retries: the member has paid and must get a row.
                    console.error('Failed to create Four Unders waitlist entry:', waitlistError);
                    return res.status(500).json({ error: 'Failed to record membership.' });
                } else {
                    console.log('Successfully created Four Unders waitlist entry for:', email, 'with referral code:', referralCode);
                }
            }

            // PHASE 2: Handle inventory tracking if gamepool_id is provided
            if (gamepool_id && gamepool_id !== 'four_unders_club') {
                console.log('Processing inventory update for gamepool:', gamepool_id);

                if (!UUID_RE.test(gamepool_id) || !UUID_RE.test(user_id)) {
                    console.error('Invalid gamepool_id or user_id in checkout metadata:', { sessionId: session.id, gamepool_id, user_id });
                    return res.status(400).json({ error: 'Invalid game entry metadata.' });
                }

                // Checks capacity, bumps current_players and records the entry in one
                // transaction, and is a no-op if this checkout was already recorded.
                const { data: claimResult, error: claimError } = await supabaseAdmin
                    .rpc('claim_gamepool_slots', {
                        p_pool_id: gamepool_id,
                        p_user_id: user_id,
                        p_qty: parsedQuantity,
                        p_checkout_id: session.id
                    });

                if (claimError) {
                    console.error('Failed to claim gamepool slots:', claimError);
                    return res.status(500).json({ error: 'Failed to update game inventory.' });
                }

                if (claimResult === 'duplicate') {
                    console.log('Gamepool entry already recorded for checkout:', session.id);
                    return res.status(200).json({ received: true });
                }

                if (claimResult === 'sold_out') {
                    // Several buyers can pass the pre-checkout check for the last slot.
                    // Whoever completes payment after it's gone gets their money back.
                    console.warn('Gamepool sold out after payment, refunding:', { gamepool_id, sessionId: session.id });
                    if (paymentIntentId) {
                        await stripe.refunds.create(
                            { payment_intent: paymentIntentId, reason: 'requested_by_customer' },
                            { idempotencyKey: `sold-out-refund-${session.id}` }
                        );
                    }
                    return res.status(200).json({ received: true, refunded: true });
                }

                console.log(`Claimed ${parsedQuantity} slot(s) for gamepool:`, gamepool_id);
            }

            // Optional: Record the payment transaction. user_id is a uuid column, so
            // guest membership checkouts (user_id "guest_...") are skipped.
            const { error: transactionError } = !UUID_RE.test(user_id) ? { error: null } : await supabaseAdmin
                .from('payment_transactions')
                .insert({
                    user_id: user_id,
                    amount: session.amount_total ? session.amount_total / 100 : 35,
                    status: 'completed',
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: session.customer as string,
                });

            if (transactionError) {
                console.error('Failed to record payment transaction:', transactionError);
                // Don't fail the webhook for this
            }

            console.log('Successfully processed payment webhook:', {
                user_id,
                gamepool_id,
                product,
                quantity: parsedQuantity,
                four_unders_membership: product === 'four_unders_membership',
                waitlist_created: !!(product === 'four_unders_membership' && email)
            });

        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({ error: 'Internal server error while processing payment.' });
        }
    }

    res.status(200).json({ received: true });
}
