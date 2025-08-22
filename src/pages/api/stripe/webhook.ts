
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create admin Supabase client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Note: In production, use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const config = {
    api: {
        bodyParser: false,
    },
};

const AUG31_4U_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_AUG31_4U_PRICE_ID;

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

        const { user_id } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const priceId = session.line_items?.data[0]?.price?.id;

        if (!user_id) {
            console.error('Webhook received checkout.session.completed with missing user_id metadata.', { metadata: session.metadata });
            return res.status(400).json({ error: 'Required user_id metadata is missing.' });
        }

        console.log('Processing successful payment for user:', user_id, { priceId, paymentIntentId });

        try {
            // Update user's member_cat to indicate they've paid for August 31 game
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

            // Optional: Record the payment transaction
            const { error: transactionError } = await supabaseAdmin
                .from('payment_transactions')
                .insert({
                    user_id: user_id,
                    amount: session.amount_total ? session.amount_total / 100 : 35, // Convert cents to dollars
                    status: 'completed',
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: session.customer as string,
                });

            if (transactionError) {
                console.error('Failed to record payment transaction:', transactionError);
                // Don't fail the webhook for this, user access is already granted
            }

            console.log('Successfully updated user access for August 31 game:', user_id);

        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({ error: 'Internal server error while processing payment.' });
        }
    }

    res.status(200).json({ received: true });
}
