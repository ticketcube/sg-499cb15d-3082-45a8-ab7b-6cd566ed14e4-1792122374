
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Create Supabase admin client for inventory checks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, userId, gamepool_id, quantity = 1 } = req.body;

    console.log('API Route - Received request:', { 
      priceId, 
      userId,
      gamepool_id,
      quantity,
      nodeEnv: process.env.NODE_ENV,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
    });

    if (!priceId || !userId || !gamepool_id) {
      console.error('Missing parameters:', { 
        priceId: !!priceId, 
        userId: !!userId, 
        gamepool_id: !!gamepool_id 
      });
      return res.status(400).json({ 
        error: 'Missing required parameters: priceId, userId, and gamepool_id are required.' 
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Payment system not configured properly' });
    }

    // PHASE 2: Pre-checkout inventory validation
    console.log('Checking inventory for gamepool:', gamepool_id);
    
    const { data: gamepool, error: gamepoolError } = await supabaseAdmin
      .from('gamepools')
      .select('id, name, current_players, max_players, status')
      .eq('id', gamepool_id)
      .eq('status', 'ACTIVE')
      .single();

    if (gamepoolError || !gamepool) {
      console.error('Failed to fetch gamepool:', gamepoolError);
      return res.status(400).json({ 
        error: 'Game pool not found or inactive' 
      });
    }

    // Check if there are enough slots available
    const availableSlots = gamepool.max_players - gamepool.current_players;
    
    console.log('Inventory check:', {
      gamepool_name: gamepool.name,
      current_players: gamepool.current_players,
      max_players: gamepool.max_players,
      available_slots: availableSlots,
      requested_quantity: quantity
    });

    if (availableSlots < quantity) {
      console.log('Game is sold out or insufficient slots available');
      return res.status(400).json({ 
        error: availableSlots === 0 
          ? 'Sorry, this game is sold out!' 
          : `Only ${availableSlots} slot(s) remaining, but you requested ${quantity}` 
      });
    }

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payment/cancel`,
      metadata: {
        user_id: userId,
        gamepool_id: gamepool_id,
        quantity: quantity.toString(),
      },
    });

    if (!session.url) {
      console.error('Stripe session created but no URL returned');
      return res.status(500).json({ error: 'Could not create Stripe session URL.' });
    }

    console.log('Stripe session created successfully:', { 
      sessionId: session.id, 
      url: session.url,
      gamepool_name: gamepool.name,
      slots_reserved: quantity
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
