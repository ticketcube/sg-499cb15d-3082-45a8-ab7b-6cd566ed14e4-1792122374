-- ============================================
-- POINTS AND PAYMENT POLICIES
-- ============================================

-- Points Ledger
CREATE POLICY "Users can view their own points ledger" 
ON public.points_ledger 
FOR SELECT 
USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own data" 
ON public.points_ledger 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id));

-- User Points
CREATE POLICY "user_points_read_policy" 
ON public.user_points 
FOR SELECT 
USING ((auth.uid() = user_id));

CREATE POLICY "user_points_insert" 
ON public.user_points 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "user_points_update" 
ON public.user_points 
FOR UPDATE 
USING ((auth.uid() = user_id));

CREATE POLICY "user_points_update_policy" 
ON public.user_points 
FOR UPDATE 
USING ((auth.uid() = user_id));

-- Payment Transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING ((auth.uid() = user_id));