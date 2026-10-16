import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Check if user has admin privileges
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('member_cat')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Access denied - profile not found' });
    }

    // Require admin member_cat
    if (profile.member_cat !== 'admin' && profile.member_cat !== 'aug31_paid') {
      return res.status(403).json({ error: 'Access denied - admin privileges required' });
    }

    // Fetch all waitlist entries with user profiles
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .select(`
        *,
        user_profiles!waitlist_id_fkey(display_name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ data: data || [] });
  } catch (error) {
    console.error("Error fetching all waitlist entries:", error);
    return res.status(500).json({ error: 'Failed to fetch waitlist entries' });
  }
}