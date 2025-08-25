
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Server-side service role client (secure)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Public endpoint - get active stripe prices for checkout
      const { data, error } = await supabaseServiceRole
        .from("stripe_prices")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json({ data: data || [] });
    } catch (error) {
      console.error("Error fetching stripe prices:", error);
      return res.status(500).json({ error: 'Failed to fetch stripe prices' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
</create_file file_path>

<create_file file_path="src/pages/api/stripe-prices/admin.ts">
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Server-side service role client (secure)
const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Check if user has admin privileges
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('member_cat')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.member_cat !== 'admin' && profile.member_cat !== 'aug31_paid')) {
      return res.status(403).json({ error: 'Access denied - admin privileges required' });
    }

    if (req.method === 'GET') {
      // Get all stripe prices (including inactive ones)
      const { data, error } = await supabaseServiceRole
        .from("stripe_prices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ data: data || [] });

    } else if (req.method === 'POST') {
      // Create new stripe price
      const { product_name, price_id, member_cat, active } = req.body;

      if (!product_name || !price_id || !member_cat) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabaseServiceRole
        .from("stripe_prices")
        .insert([{
          product_name,
          price_id,
          member_cat,
          active: active || true
        }])
        .select();

      if (error) throw error;
      return res.status(201).json({ data: data[0] });

    } else if (req.method === 'PUT') {
      // Update stripe price
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const { data, error } = await supabaseServiceRole
        .from("stripe_prices")
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return res.status(200).json({ data: data[0] });

    } else if (req.method === 'DELETE') {
      // Delete stripe price
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const { error } = await supabaseServiceRole
        .from("stripe_prices")
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ message: 'Price deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error("Error in stripe prices admin API:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
