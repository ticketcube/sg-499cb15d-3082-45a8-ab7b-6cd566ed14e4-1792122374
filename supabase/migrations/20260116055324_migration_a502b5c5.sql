-- ============================================
-- DAILY PRIZES POLICIES
-- ============================================

CREATE POLICY "daily_prizes_select" 
ON public.daily_prizes 
FOR SELECT 
USING (true);

CREATE POLICY "daily_prizes_insert" 
ON public.daily_prizes 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id));