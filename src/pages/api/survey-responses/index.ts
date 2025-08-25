
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
        const { responseId: responseIdQuery, sessionId: sessionIdQuery } = req.query;
        
        if (responseIdQuery) {
          const responseId = Array.isArray(responseIdQuery) ? responseIdQuery[0] : responseIdQuery;
          // Get specific survey response
          const { data, error } = await supabaseServiceRole
            .from("survey_responses")
            .select("*")
            .eq("id", responseId)
            .single();

          if (error) throw error;
          return res.status(200).json({ data });
        } else if (sessionIdQuery) {
          const sessionId = Array.isArray(sessionIdQuery) ? sessionIdQuery[0] : sessionIdQuery;
          // Get survey response by session ID
          const { data, error } = await supabaseServiceRole
            .from("survey_responses")
            .select("*")
            .eq("session_id", sessionId)
            .single();

          if (error) throw error;
          return res.status(200).json({ data });
        } else {
          // Get all survey responses (admin only)
          const { data, error } = await supabaseServiceRole
            .from("survey_responses")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;
          return res.status(200).json({ data: data || [] });
        }
      } catch (error) {
        console.error("Error fetching survey responses:", error);
        return res.status(500).json({ error: 'Failed to fetch survey responses' });
      }

    case 'POST':
      try {
        const responseData = req.body;
        
        const { data, error } = await supabaseServiceRole
          .from("survey_responses")
          .insert([responseData])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ data });
      } catch (error) {
        console.error("Error creating survey response:", error);
        return res.status(500).json({ error: 'Failed to create survey response' });
      }

    case 'PATCH':
      try {
        const { responseId, ...updateData } = req.body;
        
        if (!responseId) {
          return res.status(400).json({ error: 'Response ID is required' });
        }

        const { data, error } = await supabaseServiceRole
          .from("survey_responses")
          .update(updateData)
          .eq("id", responseId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ data });
      } catch (error) {
        console.error("Error updating survey response:", error);
        return res.status(500).json({ error: 'Failed to update survey response' });
      }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
