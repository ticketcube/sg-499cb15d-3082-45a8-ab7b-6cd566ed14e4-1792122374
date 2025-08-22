
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from "stripe";
import { supabase } from '@/integrations/supabase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // apiVersion: "2024-06-20", // Use library default
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable the default body parser for this route to verify the raw body
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

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata and payment details
        const { user_id } = session.metadata || {};
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const priceId = session.line_items?.data[0]?.price?.id;

        if (!user_id ) {
            console.error('Webhook received checkout.session.completed with missing metadata.', { metadata: session.metadata });
            return res.status(400).json({ error: 'Required metadata or payment info is missing.' });
        }

      
    }

    res.status(200).json({ received: true });
}