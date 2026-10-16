import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, userId, gamepool_id, metadata } = req.body;

    console.log('API Route - Received request:', { 
      priceId, 
      userId,
      gamepool_id,
      metadata,
      nodeEnv: process.env.NODE_ENV,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
    });

    if (!priceId || !userId) {
      console.error('Missing parameters:', { 
        priceId: !!priceId, 
        userId: !!userId
      });
      return res.status(400).json({ 
        error: 'Missing required parameters: priceId and userId are required.' 
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Payment system not configured properly' });
    }

    // MVP: Only allow Four Under Club membership payments
    if (gamepool_id && gamepool_id !== 'four_unders_club') {
      console.error('Invalid gamepool_id for MVP:', gamepool_id);
      return res.status(400).json({ 
        error: 'Invalid payment type. Only Four Under Club memberships are available.' 
      });
    }

    // Validate priceId exists in stripe_prices with member_cat = '4unders' and active = true
    const { data: priceData, error: priceError } = await supabaseAdmin
      .from('stripe_prices')
      .select('price_id, product_name')
      .eq('price_id', priceId)
      .eq('member_cat', '4unders')
      .eq('active', true)
      .single();

    if (priceError || !priceData) {
      console.error('Invalid or inactive price:', { priceId, error: priceError });
      return res.status(400).json({ 
        error: 'Invalid price. Please refresh and try again.' 
      });
    }

    console.log('Price validated:', priceData);

    // Log which Stripe environment we're using
    const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    console.log('Stripe environment check:', { 
      isLiveMode, 
      isTestMode, 
      priceId,
      priceIdPrefix: priceId.substring(0, 10) + '...'
    });

    const domain = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    console.log('Creating Stripe checkout session with domain:', domain);

    // Build metadata on the server - only copy safe fields from request
    const sessionMetadata: Record<string, string> = {
      user_id: userId,
      product: 'four_unders_membership',
      gamepool_id: 'four_unders_club',
      quantity: '1'
    };

    // Copy survey answers from metadata if provided
    if (metadata) {
      if (metadata.email) sessionMetadata.email = metadata.email;
      if (metadata.username) sessionMetadata.username = metadata.username;
      if (metadata.round_duration) sessionMetadata.round_duration = metadata.round_duration;
      if (metadata.last_score) sessionMetadata.last_score = metadata.last_score;
      if (metadata.price_premium) sessionMetadata.price_premium = metadata.price_premium;
      if (metadata.referred_by) sessionMetadata.referred_by = metadata.referred_by;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1, // Force quantity to 1
        },
      ],
      mode: 'payment',
      success_url: `${domain}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payment/cancel`,
      metadata: sessionMetadata,
    });

    if (!session.url) {
      console.error('Stripe session created but no URL returned');
      return res.status(500).json({ error: 'Could not create Stripe session URL.' });
    }

    console.log('Stripe session created successfully:', { 
      sessionId: session.id, 
      url: session.url,
      metadata: sessionMetadata
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('API Route - Caught error:', error);
    
    if (error instanceof Error) {
      if ('type' in error && 'code' in error) {
        const stripeError = error as {
          type: string;
          code: string;
          message: string;
          param?: string;
          requestId?: string;
        };
        console.error('Stripe-specific error details:', { 
          type: stripeError.type, 
          code: stripeError.code, 
          message: stripeError.message,
          param: stripeError.param,
          requestId: stripeError.requestId
        });
        return res.status(400).json({ error: `Stripe error: ${error.message}` });
      }
      
      console.error('Generic error:', { name: error.name, message: error.message, stack: error.stack });
      return res.status(500).json({ error: error.message });
    }
    
    console.error('Unknown error type:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}