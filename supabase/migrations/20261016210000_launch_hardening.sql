-- Launch Hardening Migration for Four Under Club MVP
-- Enable RLS on all golf tables and remove dangerous policies

-- ============================================================================
-- 1. Enable RLS on all golf tables
-- ============================================================================

ALTER TABLE public.gamepools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamepool_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Remove dangerous self-serve policies not needed for MVP
-- ============================================================================

DROP POLICY IF EXISTS "Creators can create game pools" ON public.gamepools;
DROP POLICY IF EXISTS "user_points_insert" ON public.user_points;
DROP POLICY IF EXISTS "user_points_update" ON public.user_points;
DROP POLICY IF EXISTS "user_points_update_policy" ON public.user_points;
DROP POLICY IF EXISTS "daily_prizes_insert" ON public.daily_prizes;
DROP POLICY IF EXISTS "survey_responses_select_policy" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_update_policy" ON public.survey_responses;

-- ============================================================================
-- 3. Secure four_unders_waitlist
-- ============================================================================

-- Remove policy that allows anonymous users to set paid = true
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.four_unders_waitlist;

-- Revoke all permissions and grant only safe columns for read
REVOKE ALL ON public.four_unders_waitlist FROM anon, authenticated;
GRANT SELECT (id, username, created_at, referral_code, referred_by, paid)
  ON public.four_unders_waitlist TO anon, authenticated;

-- Prevent duplicate webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS four_unders_waitlist_stripe_checkout_id_key
  ON public.four_unders_waitlist (stripe_checkout_id)
  WHERE stripe_checkout_id IS NOT NULL;

-- ============================================================================
-- 4. Remove unused RPC that allows negative quantity
-- ============================================================================

DROP FUNCTION IF EXISTS public.increment_current_players(uuid, integer);