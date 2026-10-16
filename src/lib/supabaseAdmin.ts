import { createClient } from "@supabase/supabase-js";

// Server-only client that bypasses RLS. Never import this from a page or component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
