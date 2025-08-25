
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Server-side service role client (secure)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { userId: userIdQuery } = req.query;
        
        if (userIdQuery) {
          const userId = Array.isArray(userIdQuery) ? userIdQuery[0] : userIdQuery;
          // Get specific user profile
          const { data, error } = await supabaseServiceRole
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (error) throw error;
          return res.status(200).json({ data });
        } else {
          // Get all profiles (for leaderboards, admin, etc.)
          const { data, error } = await supabaseServiceRole
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;
          return res.status(200).json({ data: data || [] });
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
        return res.status(500).json({ error: 'Failed to fetch profiles' });
      }

    case 'POST':
      try {
        const profileData = req.body;
        
        const { data, error } = await supabaseServiceRole
          .from("profiles")
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ data });
      } catch (error) {
        console.error("Error creating profile:", error);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

    case 'PATCH':
      try {
        const { userId, ...updateData } = req.body;
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        const { data, error } = await supabaseServiceRole
          .from("profiles")
          .update(updateData)
          .eq("id", userId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ data });
      } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
