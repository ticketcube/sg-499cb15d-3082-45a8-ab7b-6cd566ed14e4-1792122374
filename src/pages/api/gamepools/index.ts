
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client for accessing protected gamepools table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Fetching gamepools data...');
    
    // Fetch all active gamepools using service role to bypass RLS
    const { data: gamePools, error } = await supabaseAdmin
      .from('gamepools')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch gamepools:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch game pools',
        details: error.message 
      });
    }

    console.log(`Successfully fetched ${gamePools?.length || 0} active game pools`);

    return res.status(200).json({ 
      data: gamePools || [],
      success: true 
    });

  } catch (error) {
    console.error('API Route - Caught error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
