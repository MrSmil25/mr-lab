
-- Catalog read access
GRANT SELECT ON public.programs, public.curriculum_versions, public.courses_master, public.graduation_requirements TO authenticated;
GRANT ALL ON public.programs, public.curriculum_versions, public.courses_master, public.graduation_requirements TO service_role;

DROP POLICY IF EXISTS "Read programs" ON public.programs;
CREATE POLICY "Read programs" ON public.programs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Read curriculum versions" ON public.curriculum_versions;
CREATE POLICY "Read curriculum versions" ON public.curriculum_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Read courses" ON public.courses_master;
CREATE POLICY "Read courses" ON public.courses_master FOR SELECT TO authenticated USING (true);

-- Student profile: one row per auth user, id = auth.uid()
GRANT SELECT, INSERT, UPDATE ON public.student_profile TO authenticated;
GRANT ALL ON public.student_profile TO service_role;
DROP POLICY IF EXISTS "Read own profile" ON public.student_profile;
CREATE POLICY "Read own profile" ON public.student_profile FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Create own profile" ON public.student_profile;
CREATE POLICY "Create own profile" ON public.student_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Update own profile" ON public.student_profile;
CREATE POLICY "Update own profile" ON public.student_profile FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Student courses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_courses TO authenticated;
GRANT ALL ON public.student_courses TO service_role;
DROP POLICY IF EXISTS "Manage own student courses" ON public.student_courses;
CREATE POLICY "Manage own student courses" ON public.student_courses FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Custom courses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_courses TO authenticated;
GRANT ALL ON public.custom_courses TO service_role;
DROP POLICY IF EXISTS "Manage own custom courses" ON public.custom_courses;
CREATE POLICY "Manage own custom courses" ON public.custom_courses FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Existing student-scoped tables need Data API grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_course_bookmarks, public.student_krs_plan, public.course_notes TO authenticated;
GRANT SELECT, INSERT ON public.course_resources, public.course_files TO authenticated;
GRANT SELECT ON public.user_roles, public.activity_logs, public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.student_course_bookmarks, public.student_krs_plan, public.course_notes, public.course_resources, public.course_files, public.user_roles, public.activity_logs, public.notifications TO service_role;

-- Views run with the caller's rights so row level security applies to them too
ALTER VIEW public.student_dashboard_view SET (security_invoker = on);
ALTER VIEW public.student_home_dashboard_view SET (security_invoker = on);
ALTER VIEW public.student_course_recommendation_view SET (security_invoker = on);
ALTER VIEW public.smart_krs_recommendation_view SET (security_invoker = on);
ALTER VIEW public.student_prerequisite_check_view SET (security_invoker = on);
ALTER VIEW public.student_krs_summary_view SET (security_invoker = on);
ALTER VIEW public.student_academic_progress SET (security_invoker = on);
ALTER VIEW public.student_activity_timeline_view SET (security_invoker = on);
ALTER VIEW public.notification_summary_view SET (security_invoker = on);
ALTER VIEW public.course_library_view SET (security_invoker = on);
ALTER VIEW public.library_courses_view SET (security_invoker = on);
ALTER VIEW public.curriculum_summary_view SET (security_invoker = on);
ALTER VIEW public.graduation_requirement_view SET (security_invoker = on);

GRANT SELECT ON public.student_dashboard_view, public.student_home_dashboard_view, public.student_course_recommendation_view,
  public.smart_krs_recommendation_view, public.student_prerequisite_check_view, public.student_krs_summary_view,
  public.student_academic_progress, public.student_activity_timeline_view, public.notification_summary_view,
  public.course_library_view, public.library_courses_view, public.curriculum_summary_view, public.graduation_requirement_view
  TO authenticated;
