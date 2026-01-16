-- ============================================
-- SURVEY RESPONSES POLICIES
-- ============================================

CREATE POLICY "survey_responses_select_policy" 
ON public.survey_responses 
FOR SELECT 
USING (((auth.uid() IS NULL) OR (auth.uid() = user_id) OR (user_id IS NULL)));

CREATE POLICY "survey_responses_insert_policy" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "survey_responses_update_policy" 
ON public.survey_responses 
FOR UPDATE 
USING (((auth.uid() IS NULL) OR (auth.uid() = user_id) OR (user_id IS NULL)));

CREATE POLICY "survey_responses_admin_policy" 
ON public.survey_responses 
USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));