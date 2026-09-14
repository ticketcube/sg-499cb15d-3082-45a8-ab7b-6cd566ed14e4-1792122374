import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// IMPORTANT: Create a Supabase client with the SERVICE ROLE KEY for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

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

        const { user_id, gamepool_id, quantity, product, email, username, round_duration, last_score, price_premium } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (!user_id) {
            console.error('Webhook received checkout.session.completed with missing user_id metadata.', { metadata: session.metadata });
            return res.status(400).json({ error: 'Required user_id metadata is missing.' });
        }

        // Parse quantity from metadata (default to 1 if not provided)
        const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;

        console.log('Processing successful payment:', { 
            user_id, 
            gamepool_id,
            product,
            quantity: parsedQuantity,
            sessionId: session.id,
            paymentIntentId,
            email,
            username
        });

        try {
            // Check if this is a Four Unders membership payment
            if (product === 'four_unders_membership' && email && username) {
                console.log('Processing Four Unders membership payment');

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
                        amount_paid: session.amount_total ? session.amount_total / 100 : 50
                    });

                if (waitlistError) {
                    console.error('Failed to create Four Unders waitlist entry:', waitlistError);
                    // Don't fail the webhook, but log the error
                } else {
                    console.log('Successfully created Four Unders waitlist entry for:', email);
                }
            }

            // PHASE 2: Handle inventory tracking if gamepool_id is provided
            if (gamepool_id && gamepool_id !== 'four_unders_club') {
                console.log('Processing inventory update for gamepool:', gamepool_id);

                // Create gamepool entry record
                const { data: entryData, error: entryError } = await supabaseAdmin
                    .from('gamepool_entries')
                    .insert({
                        gamepool_id,
                        user_id,
                        quantity: parsedQuantity,
                        stripe_checkout_id: session.id
                    })
                    .select();

                if (entryError) {
                    console.error('Failed to create gamepool entry:', entryError);
                    return res.status(500).json({ error: 'Failed to record game entry.' });
                }

                console.log('Successfully created gamepool entry:', entryData);

                // Update gamepool current_players count atomically
                const { error: rpcError } = await supabaseAdmin
                    .rpc('increment_current_players', {
                        pool_id: gamepool_id,
                        qty: parsedQuantity
                    });

                if (rpcError) {
                    console.error('Failed to increment current_players:', rpcError);
                    // This is critical - if we can't update the count, we have oversold
                    return res.status(500).json({ error: 'Failed to update game inventory.' });
                }

                console.log(`Successfully incremented current_players by ${parsedQuantity} for gamepool:`, gamepool_id);

                // Update user's member_cat to indicate they've paid
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({ 
                        member_cat: 'aug31_paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user_id);

                if (error) {
                    console.error('Failed to update user profile:', error);
                    return res.status(500).json({ error: 'Failed to update user access.' });
                }
            }

            // Optional: Record the payment transaction (for all payments)
            const { error: transactionError } = await supabaseAdmin
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
