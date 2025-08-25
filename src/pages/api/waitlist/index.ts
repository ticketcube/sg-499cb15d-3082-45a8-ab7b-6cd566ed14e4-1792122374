
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Server-side service role client (secure)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type WaitlistEntry = Database["public"]["Tables"]["waitlist"]["Row"];
type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { data, error } = await supabaseServiceRole
        .from("waitlist")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - user not on waitlist yet
          return res.status(200).json({ data: null });
        }
        throw error;
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error fetching user waitlist:", error);
      return res.status(500).json({ error: 'Failed to fetch waitlist data' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { userId, dates } = req.body;

      if (!userId || !dates) {
        return res.status(400).json({ error: 'User ID and dates are required' });
      }

      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: 'At least one date is required' });
      }
      
      if (dates.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 dates allowed' });
      }

      const waitlistData: WaitlistInsert = {
        id: userId,
        avail_1: dates[0],
        avail_2: dates[1] || null,
        avail_3: dates[2] || null,
      };

      const { data, error } = await supabaseServiceRole
        .from("waitlist")
        .upsert(waitlistData)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error upserting waitlist:", error);
      return res.status(500).json({ error: 'Failed to update waitlist' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { error } = await supabaseServiceRole
        .from("waitlist")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      return res.status(500).json({ error: 'Failed to remove from waitlist' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
