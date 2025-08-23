
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Log environment info
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    
    console.log('Testing price with environment:', { isLiveMode, isTestMode, priceId });

    // Try to retrieve the price
    const price = await stripe.prices.retrieve(priceId);
    
    return res.status(200).json({
      success: true,
      price: {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        product: price.product,
        active: price.active,
        created: price.created,
        livemode: price.livemode
      },
      environment: {
        isLiveMode,
        isTestMode,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
      }
    });

  } catch (error: any) {
    console.error('Stripe price test error:', error);
    
    return res.status(400).json({
      error: error.message || 'Failed to test price',
      type: error.type,
      code: error.code,
      param: error.param,
      environment: {
        isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
        isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
      }
    });
  }
}
