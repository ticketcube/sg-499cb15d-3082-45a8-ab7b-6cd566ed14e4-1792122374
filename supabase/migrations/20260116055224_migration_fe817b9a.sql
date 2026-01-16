-- ============================================
-- COURSES AND TEES POLICIES (Public Read)
-- ============================================

CREATE POLICY "courses_public_read" 
ON public.courses 
FOR SELECT 
USING (true);

CREATE POLICY "courses_read_policy" 
ON public.courses 
FOR SELECT 
USING (true);

CREATE POLICY "course_tees_public_read" 
ON public.course_tees 
FOR SELECT 
USING (true);

CREATE POLICY "course_tees_read_policy" 
ON public.course_tees 
FOR SELECT 
USING (true);