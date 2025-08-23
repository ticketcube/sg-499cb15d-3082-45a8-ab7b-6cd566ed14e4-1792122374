
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create admin Supabase client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Note: In production, use service role key
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

const priceId = session?.metadata?.price_id || session?.display_items?.[0]?.price?.id;

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
        const paymentIntentId =
            typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;

        if (!user_id) {
            console.error('Missing user_id in session metadata:', session.metadata);
            return res.status(400).json({ error: 'user_id required' });
        }

        // ✅ Retrieve line items to get the priceId
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;

        if (!priceId) {
            console.error('No priceId found for session:', session.id);
            return res.status(400).json({ error: 'Price ID not found' });
        }

        // ✅ Lookup mapping in Supabase
        const { data: mapping, error: mappingError } = await supabaseAdmin
            .from('stripe_prices')
            .select('member_cat')
            .eq('price_id', priceId)
            .single();

        if (mappingError || !mapping) {
            console.error('No mapping found for priceId:', priceId, mappingError);
            return res.status(400).json({ error: 'Unknown product' });
        }

        try {
            // ✅ Update the user’s profile dynamically based on DB mapping
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    member_cat: mapping.member_cat,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user_id);

            if (error) {
                console.error('Failed to update user profile:', error);
                return res.status(500).json({ error: 'Failed to update profile' });
            }

            // (Optional) Record payment transaction
            await supabaseAdmin.from('payment_transactions').insert({
                user_id,
                amount: session.amount_total ? session.amount_total / 100 : null,
                status: 'completed',
                stripe_payment_intent_id: paymentIntentId,
                stripe_customer_id: session.customer as string,
            });

            console.log(`✅ Updated ${user_id} to category ${mapping.member_cat}`);
        } catch (err) {
            console.error('Webhook processing error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }


    res.status(200).json({ received: true });
}