import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const MEMBERSHIP_POOL_ID = 'four_unders_club';
const MAX_QUANTITY_PER_CHECKOUT = 4;

// Client-supplied metadata keys the webhook is allowed to read for memberships.
// Everything else (user_id, gamepool_id, quantity, product) is set by the server.
const MEMBERSHIP_METADATA_KEYS = ['email', 'username', 'round_duration', 'last_score', 'price_premium', 'referred_by'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, gamepool_id, metadata } = req.body;
    let { userId } = req.body;
    const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    console.log('API Route - Received request:', { 
      priceId, 
      userId,
      gamepool_id,
      quantity,
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

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_CHECKOUT) {
      return res.status(400).json({ error: `Quantity must be a whole number from 1 to ${MAX_QUANTITY_PER_CHECKOUT}.` });
    }

    // Only charge prices we've configured, so a caller can't swap in a cheaper price.
    const { data: knownPrice } = await supabaseAdmin
      .from('stripe_prices')
      .select('price_id')
      .eq('price_id', priceId)
      .eq('active', true)
      .maybeSingle();

    if (!knownPrice) {
      return res.status(400).json({ error: 'Unknown price.' });
    }

    // PHASE 2: Pre-checkout inventory validation (only for game entries, not memberships)
    const isMembershipPayment = !gamepool_id || gamepool_id === MEMBERSHIP_POOL_ID;

    if (!isMembershipPayment) {
      // A tournament slot belongs to a real account, so take the user from the
      // session token rather than trusting the request body.
      const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice('Bearer '.length)
        : null;
      const { data: authData } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null } };
      if (!authData.user) {
        return res.status(401).json({ error: 'Please sign in to join this game.' });
      }
      userId = authData.user.id;

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
    } else {
      console.log('Skipping gamepool validation - this is a membership payment');
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

    // Server-owned fields go last so request metadata can't override them.
    const sessionMetadata: Record<string, string> = {};
    if (isMembershipPayment) {
      for (const key of MEMBERSHIP_METADATA_KEYS) {
        if (metadata?.[key] !== undefined) sessionMetadata[key] = String(metadata[key]);
      }
      sessionMetadata.product = 'four_unders_membership';
      sessionMetadata.gamepool_id = MEMBERSHIP_POOL_ID;
    } else {
      sessionMetadata.gamepool_id = gamepool_id;
    }
    sessionMetadata.user_id = userId;
    sessionMetadata.quantity = quantity.toString();

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
      metadata: sessionMetadata,
    });

    if (!session.url) {
      console.error('Stripe session created but no URL returned');
      return res.status(500).json({ error: 'Could not create Stripe session URL.' });
    }

    console.log('Stripe session created successfully:', { 
      sessionId: session.id, 
      url: session.url,
      isMembershipPayment,
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
