
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Create a server-side Supabase client for API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This is fine for reading public data
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, cubeId, userId } = req.body;

    console.log('API Route - Received request:', { priceId, cubeId, userId });

    // Validate required parameters
    if (!priceId || !userId) {
      console.error('Missing parameters:', { priceId: !!priceId, userId: !!userId });
      return res.status(400).json({ error: 'Missing required parameters: priceId and userId are required.' });
    }

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Payment system not configured properly' });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database not configured properly' });
    }

   

    // Get the domain from environment or fallback to localhost for development
      const domain = process.env.NEXT_PUBLIC_APP_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');


    // Create a Checkout Session
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

    // Return the session URL to redirect the user
    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('API Route - Caught error:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Check if it's a Stripe error
      if ('type' in error && 'code' in error) {
        console.error('Stripe-specific error:', { type: error.type, code: (error as any).code, message: error.message });
        return res.status(400).json({ error: `Stripe error: ${error.message}` });
      }
      
      // Generic error
      console.error('Generic error:', { name: error.name, message: error.message, stack: error.stack });
      return res.status(500).json({ error: error.message });
    }
    
    // Unknown error type
    console.error('Unknown error type:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}