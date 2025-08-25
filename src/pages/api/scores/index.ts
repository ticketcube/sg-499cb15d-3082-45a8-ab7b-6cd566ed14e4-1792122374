
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
        const { userId: userIdQuery, month: monthQuery, year: yearQuery } = req.query;
        
        let query = supabaseServiceRole.from("game_scores").select("*");
        
        if (userIdQuery) {
          const userId = Array.isArray(userIdQuery) ? userIdQuery[0] : userIdQuery;
          query = query.eq("user_id", userId);
        }
        
        if (monthQuery && yearQuery) {
          const month = Array.isArray(monthQuery) ? monthQuery[0] : monthQuery;
          const year = Array.isArray(yearQuery) ? yearQuery[0] : yearQuery;
          const startDate = new Date(Number(year), Number(month) - 1, 1);
          const endDate = new Date(Number(year), Number(month), 0);
          query = query
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());
        }
        
        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        return res.status(200).json({ data: data || [] });
      } catch (error) {
        console.error("Error fetching scores:", error);
        return res.status(500).json({ error: 'Failed to fetch scores' });
      }

    case 'POST':
      try {
        const scoreData = req.body;
        
        const { data, error } = await supabaseServiceRole
          .from("game_scores")
          .insert([scoreData])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ data });
      } catch (error) {
        console.error("Error creating score:", error);
        return res.status(500).json({ error: 'Failed to create score' });
      }

    case 'PATCH':
      try {
        const { scoreId, ...updateData } = req.body;
        
        if (!scoreId) {
          return res.status(400).json({ error: 'Score ID is required' });
        }

        const { data, error } = await supabaseServiceRole
          .from("game_scores")
          .update(updateData)
          .eq("id", scoreId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ data });
      } catch (error) {
        console.error("Error updating score:", error);
        return res.status(500).json({ error: 'Failed to update score' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
