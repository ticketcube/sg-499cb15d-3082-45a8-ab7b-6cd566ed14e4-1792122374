import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

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

        // Only process if payment was successful
        if (session.payment_status !== 'paid') {
            console.log('Ignoring session - payment not completed:', session.id);
            return res.status(200).json({ received: true });
        }

        const { user_id, product, email, username, round_duration, last_score, price_premium, referred_by } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (!user_id) {
            console.error('Webhook received checkout.session.completed with missing user_id metadata.', { metadata: session.metadata });
            return res.status(400).json({ error: 'Required user_id metadata is missing.' });
        }

        console.log('Processing successful payment:', { 
            user_id, 
            product,
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

                if (waitlistError) {
                    // Check if this is a duplicate checkout_id (webhook retry)
                    if (waitlistError.code === '23505') {
                        console.log('Duplicate stripe_checkout_id detected - webhook already processed:', session.id);
                        return res.status(200).json({ received: true, message: 'Already processed' });
                    }
                    
                    // Any other error is critical - return 500 so Stripe retries
                    console.error('Failed to create Four Unders waitlist entry:', waitlistError);
                    return res.status(500).json({ error: 'Failed to process membership payment' });
                }

                console.log('Successfully created Four Unders waitlist entry for:', email, 'with referral code:', referralCode);
            }

            // Record payment transaction (only for valid UUIDs, not guest checkouts)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(user_id)) {
                const { error: transactionError } = await supabaseAdmin
                    .from('payment_transactions')
                    .insert({
                        user_id: user_id,
                        amount: session.amount_total ? session.amount_total / 100 : 50,
                        status: 'completed',
                        stripe_payment_intent_id: paymentIntentId,
                        stripe_customer_id: session.customer as string,
                    });

                if (transactionError) {
                    console.error('Failed to record payment transaction:', transactionError);
                    // Don't fail the webhook for this non-critical error
                }
            } else {
                console.log('Skipping payment_transactions insert for non-UUID user_id:', user_id);
            }

            console.log('Successfully processed payment webhook:', {
                user_id,
                product,
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