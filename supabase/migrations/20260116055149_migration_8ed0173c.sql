-- ============================================
-- WAITLIST POLICIES
-- ============================================

CREATE POLICY "Users can view their own waitlist entries" 
ON public.waitlist 
FOR SELECT 
TO authenticated 
USING ((id = auth.uid()));