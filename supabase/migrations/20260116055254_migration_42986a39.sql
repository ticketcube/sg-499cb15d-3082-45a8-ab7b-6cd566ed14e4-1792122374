-- ============================================
-- GAMEPOOL ENTRIES POLICIES
-- ============================================

CREATE POLICY "Users can view their own game entries" 
ON public.gamepool_entries 
FOR SELECT 
USING ((auth.uid() = user_id));

CREATE POLICY "Deny delete on game_pool_entries" 
ON public.gamepool_entries 
FOR DELETE 
USING (false);

CREATE POLICY "Deny insert on game_pool_entries" 
ON public.gamepool_entries 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Deny update on game_pool_entries" 
ON public.gamepool_entries 
FOR UPDATE 
USING (false) 
WITH CHECK (false);