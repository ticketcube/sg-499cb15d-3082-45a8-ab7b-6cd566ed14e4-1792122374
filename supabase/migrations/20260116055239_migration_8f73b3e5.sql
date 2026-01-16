-- ============================================
-- GAMEPOOL POLICIES (Fixed conflicts)
-- ============================================

-- Allow authenticated users to view all game pools
CREATE POLICY "Anyone can view game pools" 
ON public.gamepools 
FOR SELECT 
TO authenticated 
USING (true);

-- Creators can create game pools
CREATE POLICY "Creators can create game pools" 
ON public.gamepools 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by));

-- Deny all other operations (UPDATE, DELETE)
CREATE POLICY "Deny all access to gamepools" 
ON public.gamepools 
FOR UPDATE
USING (false) 
WITH CHECK (false);