
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
    // Authentication check - verify user has admin access
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Check if user has admin privileges (you can customize this check)
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('member_cat')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Access denied - profile not found' });
    }

    // Add admin check here - for now using member_cat as a simple check
    // You might want to add a separate admin role field later
    if (profile.member_cat !== 'admin' && profile.member_cat !== 'aug31_paid') {
      return res.status(403).json({ error: 'Access denied - admin privileges required' });
    }

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