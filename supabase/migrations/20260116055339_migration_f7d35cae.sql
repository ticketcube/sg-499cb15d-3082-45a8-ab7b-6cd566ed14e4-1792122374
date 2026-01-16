-- ============================================
-- STRIPE PRICES POLICY (Deny client access)
-- ============================================

CREATE POLICY "Deny all client access to stripe_prices" 
ON public.stripe_prices 
USING (false) 
WITH CHECK (false);