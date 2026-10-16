-- ============================================
-- LAUNCH HARDENING: RLS, inventory, score integrity
-- ============================================
-- Policies for these tables were created earlier, but RLS itself was never
-- enabled, so the anon key had full read/write access to every row.

-- --------------------------------------------
-- 1. Enable RLS on the golf tables
-- --------------------------------------------
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

-- gamepools: read-only from the client; only the service role writes.
DROP POLICY IF EXISTS "Creators can create game pools" ON public.gamepools;

-- Points and prizes are awarded server-side, never self-reported.
DROP POLICY IF EXISTS "user_points_insert" ON public.user_points;
DROP POLICY IF EXISTS "user_points_update" ON public.user_points;
DROP POLICY IF EXISTS "user_points_update_policy" ON public.user_points;
DROP POLICY IF EXISTS "daily_prizes_insert" ON public.daily_prizes;

-- survey_responses: anyone may submit, nobody may read or edit others' rows.
-- (The old policies let any signed-out visitor read and update every row.)
DROP POLICY IF EXISTS "survey_responses_select_policy" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_update_policy" ON public.survey_responses;
CREATE POLICY "survey_responses_select_own"
ON public.survey_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- --------------------------------------------
-- 2. four_unders_waitlist: hide emails and payment ids, block forged "paid" rows
-- --------------------------------------------
-- Inserts now go through /api/4unders-waitlist and the Stripe webhook,
-- both of which use the service role.
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.four_unders_waitlist;

-- The public /members page only needs these columns.
REVOKE ALL ON public.four_unders_waitlist FROM anon, authenticated;
GRANT SELECT (id, username, created_at, referral_code, referred_by, paid)
  ON public.four_unders_waitlist TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS four_unders_waitlist_stripe_checkout_id_key
  ON public.four_unders_waitlist (stripe_checkout_id)
  WHERE stripe_checkout_id IS NOT NULL;

-- --------------------------------------------
-- 3. Inventory: atomic, idempotent slot claim
-- --------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS gamepool_entries_stripe_checkout_id_key
  ON public.gamepool_entries (stripe_checkout_id)
  WHERE stripe_checkout_id IS NOT NULL;

ALTER TABLE public.gamepools
  ADD CONSTRAINT gamepools_players_within_capacity
  CHECK (current_players >= 0 AND current_players <= max_players);

-- The old function returned void whether or not it updated a row, so a
-- sold-out pool was indistinguishable from success, and anon could call it
-- with a negative qty to free up slots.
DROP FUNCTION IF EXISTS public.increment_current_players(uuid, integer);

-- Returns 'claimed', 'duplicate' (this checkout was already recorded) or
-- 'sold_out'. The capacity check, the counter bump and the entry insert
-- happen in one transaction.
CREATE OR REPLACE FUNCTION public.claim_gamepool_slots(
  p_pool_id uuid,
  p_user_id uuid,
  p_qty integer,
  p_checkout_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN
    RAISE EXCEPTION 'quantity must be at least 1';
  END IF;

  IF EXISTS (SELECT 1 FROM gamepool_entries WHERE stripe_checkout_id = p_checkout_id) THEN
    RETURN 'duplicate';
  END IF;

  BEGIN
    UPDATE gamepools
    SET current_players = current_players + p_qty
    WHERE id = p_pool_id
      AND status = 'ACTIVE'
      AND current_players + p_qty <= max_players;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RETURN 'sold_out';
    END IF;

    INSERT INTO gamepool_entries (gamepool_id, user_id, quantity, stripe_checkout_id)
    VALUES (p_pool_id, p_user_id, p_qty, p_checkout_id);
  EXCEPTION WHEN unique_violation THEN
    -- A concurrent delivery of the same webhook won the race; its claim stands
    -- and this block's counter bump is rolled back.
    RETURN 'duplicate';
  END;

  RETURN 'claimed';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_gamepool_slots(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_gamepool_slots(uuid, uuid, integer, text) TO service_role;

-- --------------------------------------------
-- 4. 4Points: recompute scores server-side
-- --------------------------------------------
-- The client sends hole_scores; totals are derived from them so a player
-- can't post an arbitrary total_points to the leaderboard.
CREATE OR REPLACE FUNCTION public.games_validate_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_holes integer;
  v_total integer;
  v_bad integer;
BEGIN
  IF jsonb_typeof(NEW.hole_scores) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'hole_scores must be an array';
  END IF;

  SELECT
    count(DISTINCT (h->>'hole')::int),
    coalesce(sum((h->>'points')::int), 0),
    count(*) FILTER (
      WHERE (h->>'points')::int NOT IN (0, 1, 2, 4, 6)
         OR (h->>'hole')::int NOT BETWEEN 1 AND 18
    )
  INTO v_holes, v_total, v_bad
  FROM jsonb_array_elements(NEW.hole_scores) AS h;

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'hole_scores contains invalid holes or points';
  END IF;

  IF v_holes <> jsonb_array_length(NEW.hole_scores) OR v_holes <> NEW.game_type THEN
    RAISE EXCEPTION 'expected % distinct holes, got %', NEW.game_type, v_holes;
  END IF;

  NEW.total_points := v_total;
  NEW.four_points_earned := v_total - NEW.target_score;
  NEW.validated := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_validate_score ON public.games;
CREATE TRIGGER games_validate_score
  BEFORE INSERT ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.games_validate_score();
