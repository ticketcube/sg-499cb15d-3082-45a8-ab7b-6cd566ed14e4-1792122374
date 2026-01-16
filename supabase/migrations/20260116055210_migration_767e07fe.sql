-- ============================================
-- GAMES POLICIES (Fixed from game_scores)
-- ============================================

CREATE POLICY "games_select" 
ON public.games 
FOR SELECT 
USING (true);

CREATE POLICY "games_read_policy" 
ON public.games 
FOR SELECT 
USING (true);

CREATE POLICY "games_insert" 
ON public.games 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "games_insert_policy" 
ON public.games 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id));