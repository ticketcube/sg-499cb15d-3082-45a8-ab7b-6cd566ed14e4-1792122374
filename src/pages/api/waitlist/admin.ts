
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Server-side service role client (secure)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseServiceRole
      .from("waitlist")
      .select(`
        *,
        profiles!waitlist_id_fkey(display_name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ data: data || [] });
  } catch (error) {
    console.error("Error fetching all waitlist entries:", error);
    return res.status(500).json({ error: 'Failed to fetch waitlist entries' });
  }
}
