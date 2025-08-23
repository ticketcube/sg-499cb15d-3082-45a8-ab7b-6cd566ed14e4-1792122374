
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, userId } = req.body;

    console.log('API Route - Received request:', { priceId, userId });

    if (!priceId || !userId) {
      console.error('Missing parameters:', { priceId: !!priceId, userId: !!userId });
      return res.status(400).json({ error: 'Missing required parameters: priceId and userId are required.' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Payment system not configured properly' });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database not configured properly' });
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payment/cancel`,
      metadata: {
        user_id: userId,
      },
    });

    if (!session.url) {
      console.error('Stripe session created but no URL returned');
      return res.status(500).json({ error: 'Could not create Stripe session URL.' });
    }

    console.log('Stripe session created successfully:', { sessionId: session.id, url: session.url });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('API Route - Caught error:', error);
    
    if (error instanceof Error) {
      if ('type' in error && 'code' in error) {
        console.error('Stripe-specific error:', { type: error.type, code: (error as any).code, message: error.message });
        return res.status(400).json({ error: `Stripe error: ${error.message}` });
      }
      
      console.error('Generic error:', { name: error.name, message: error.message, stack: error.stack });
      return res.status(500).json({ error: error.message });
    }
    
    console.error('Unknown error type:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}