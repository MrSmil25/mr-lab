-- Roles ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
CREATE POLICY "own roles readable" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Dashboard -----------------------------------------------------------
CREATE OR REPLACE VIEW public.student_home_dashboard_view
WITH (security_invoker = true) AS
SELECT
  s.id                                   AS student_id,
  s.user_id,
  NULLIF(s.name, '')                     AS student_name,
  COALESCE(NULLIF(s.program, ''), p.name) AS program_name,
  COALESCE(NULLIF(s.faculty, ''), p.faculty)       AS faculty,
  COALESCE(NULLIF(s.university, ''), p.university) AS university,
  p.curriculum_year,
  p.code                                 AS program_code,
  s.program_id,
  s.entry_year,
  s.current_semester,
  s.target_gpa,
  COALESCE(c.completed_credits, 0)::int  AS completed_credits,
  COALESCE(p.total_sks, s.target_sks)::int AS minimum_graduation_credit,
  GREATEST(COALESCE(p.total_sks, s.target_sks) - COALESCE(c.completed_credits, 0), 0)::int AS remaining_credits,
  LEAST(ROUND(COALESCE(c.completed_credits, 0)::numeric * 100
        / NULLIF(COALESCE(p.total_sks, s.target_sks), 0)), 100)::int AS graduation_percentage,
  COALESCE(a.active_courses, 0)::int     AS active_courses,
  COALESCE(a.active_credits, 0)::int     AS active_credits,
  s.onboarding_completed_at
FROM public.students s
LEFT JOIN public.programs p ON p.id = s.program_id
LEFT JOIN LATERAL (
  SELECT SUM(e.sks) AS completed_credits FROM public.course_enrollments e
  WHERE e.user_id = s.user_id AND e.status = 'completed'
) c ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS active_courses, SUM(e.sks) AS active_credits FROM public.course_enrollments e
  WHERE e.user_id = s.user_id AND e.status = 'active'
) a ON true;

GRANT SELECT ON public.student_home_dashboard_view TO authenticated;

CREATE OR REPLACE VIEW public.student_dashboard_view
WITH (security_invoker = true) AS
SELECT
  h.*,
  COALESCE(t.open_tasks, 0)::int  AS open_tasks,
  COALESCE(t.done_tasks, 0)::int  AS completed_tasks,
  COALESCE(n.note_count, 0)::int  AS note_count,
  COALESCE(r.resource_count, 0)::int AS resource_count
FROM public.student_home_dashboard_view h
LEFT JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE NOT done) AS open_tasks,
         COUNT(*) FILTER (WHERE done)     AS done_tasks
  FROM public.tasks WHERE user_id = h.user_id
) t ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS note_count FROM public.notes WHERE user_id = h.user_id
) n ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS resource_count FROM public.resources WHERE user_id = h.user_id
) r ON true;

GRANT SELECT ON public.student_dashboard_view TO authenticated;

-- Recommendations -----------------------------------------------------
CREATE OR REPLACE VIEW public.student_course_recommendation_view
WITH (security_invoker = true) AS
SELECT
  s.user_id,
  cc.id                AS curriculum_course_id,
  cc.program_id,
  cc.code,
  cc.name,
  cc.sks,
  cc.category,
  cc.course_group,
  cc.track,
  cc.note,
  cc.semester          AS recommended_semester,
  s.current_semester,
  COALESCE(pr.codes, ARRAY[]::text[]) AS prerequisites,
  NOT EXISTS (
    SELECT 1 FROM public.course_prerequisites p2
    WHERE p2.course_id = cc.id
      AND p2.prerequisite_code NOT IN (
        SELECT e.course_code FROM public.course_enrollments e
        WHERE e.user_id = s.user_id AND e.status = 'completed'
      )
  ) AS prerequisites_met,
  EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = s.user_id AND e.course_code = cc.code
  ) AS already_taken,
  EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = s.user_id AND e.course_code = cc.code AND e.status = 'completed'
  ) AS already_completed
FROM public.students s
JOIN public.curriculum_courses cc ON cc.program_id = s.program_id
LEFT JOIN LATERAL (
  SELECT ARRAY_AGG(p3.prerequisite_code ORDER BY p3.prerequisite_code) AS codes
  FROM public.course_prerequisites p3 WHERE p3.course_id = cc.id
) pr ON true;

GRANT SELECT ON public.student_course_recommendation_view TO authenticated;

-- Curriculum summary (public master data) -----------------------------
CREATE OR REPLACE VIEW public.curriculum_summary_view
WITH (security_invoker = true) AS
SELECT
  p.id AS program_id,
  p.code AS program_code,
  p.name AS program_name,
  p.curriculum_year,
  p.total_sks,
  COALESCE(cc.category, cc.course_group, 'Other') AS category,
  SUM(cc.sks)::int   AS category_sks,
  COUNT(*)::int      AS course_count
FROM public.programs p
JOIN public.curriculum_courses cc ON cc.program_id = p.id
GROUP BY p.id, p.code, p.name, p.curriculum_year, p.total_sks, COALESCE(cc.category, cc.course_group, 'Other');

GRANT SELECT ON public.curriculum_summary_view TO anon, authenticated;

-- Graduation requirement ----------------------------------------------
CREATE OR REPLACE VIEW public.graduation_requirement_view
WITH (security_invoker = true) AS
SELECT
  h.user_id,
  h.program_id,
  h.program_name,
  h.completed_credits,
  h.minimum_graduation_credit,
  h.remaining_credits,
  h.graduation_percentage,
  h.current_semester
FROM public.student_home_dashboard_view h;

GRANT SELECT ON public.graduation_requirement_view TO authenticated;