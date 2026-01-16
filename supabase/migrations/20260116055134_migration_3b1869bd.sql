-- ============================================
-- SERVICE ROLE AND ADMIN POLICIES
-- ============================================

-- Service role full access to waitlist
CREATE POLICY "Allow service role full access to waitlist" 
ON public.waitlist 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role full access" 
ON public.waitlist 
USING ((auth.role() = 'service_role'::text)) 
WITH CHECK ((auth.role() = 'service_role'::text));

-- Admin settings policies
CREATE POLICY "admin_settings_policy" 
ON public.admin_settings 
USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));

CREATE POLICY "admin_settings_read_survey" 
ON public.admin_settings 
FOR SELECT 
USING ((setting_key = 'survey_enabled'::text));