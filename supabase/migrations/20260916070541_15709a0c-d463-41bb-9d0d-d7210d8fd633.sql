
-- shared updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ===== master / curriculum data (public readable) =====
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  faculty text NOT NULL,
  university text NOT NULL,
  total_sks integer NOT NULL DEFAULT 144,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs readable by everyone" ON public.programs FOR SELECT USING (true);

CREATE TABLE public.curriculum_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sks integer NOT NULL DEFAULT 0,
  course_group text,
  semester integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, code)
);
GRANT SELECT ON public.curriculum_courses TO anon, authenticated;
GRANT ALL ON public.curriculum_courses TO service_role;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum readable by everyone" ON public.curriculum_courses FOR SELECT USING (true);

CREATE TABLE public.course_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.curriculum_courses(id) ON DELETE CASCADE,
  prerequisite_code text NOT NULL,
  UNIQUE (course_id, prerequisite_code)
);
GRANT SELECT ON public.course_prerequisites TO anon, authenticated;
GRANT ALL ON public.course_prerequisites TO service_role;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prerequisites readable by everyone" ON public.course_prerequisites FOR SELECT USING (true);

-- ===== personal data =====
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  program text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT '',
  entry_year integer NOT NULL DEFAULT date_part('year', now()),
  current_semester integer NOT NULL DEFAULT 1,
  target_gpa numeric(3,2) NOT NULL DEFAULT 3.50,
  target_sks integer NOT NULL DEFAULT 144,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student row" ON public.students FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  number integer NOT NULL,
  academic_year text,
  status text NOT NULL DEFAULT 'active',
  gpa numeric(3,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, number)
);

CREATE TABLE public.custom_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sks integer NOT NULL DEFAULT 0,
  course_group text,
  semester integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE CASCADE,
  course_code text NOT NULL,
  course_name text,
  sks integer,
  curriculum_course_id uuid REFERENCES public.curriculum_courses(id) ON DELETE SET NULL,
  custom_course_id uuid REFERENCES public.custom_courses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  lecturer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  section text NOT NULL,
  lecturer text,
  assistant text,
  room text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.course_sections(id) ON DELETE CASCADE,
  day text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  room text,
  kind text NOT NULL DEFAULT 'class',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assistant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text NOT NULL,
  section text,
  assistant text,
  day text,
  start_time text,
  end_time text,
  room text,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text,
  kind text NOT NULL DEFAULT 'link',
  title text NOT NULL,
  description text,
  url text,
  file_path text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text,
  title text NOT NULL,
  topic text,
  body text,
  attachment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text,
  title text NOT NULL,
  description text,
  category text,
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Not started',
  done boolean NOT NULL DEFAULT false,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'UTS',
  exam_date date,
  start_time text,
  room text,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  readiness integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  course_code text,
  component text,
  weight numeric(5,2),
  score numeric(5,2),
  letter text,
  grade_point numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['semesters','custom_courses','course_enrollments','course_sections','schedules','assistant_sessions','resources','notes','tasks','exams','grades']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (user_id);', 'idx_' || t || '_user', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['semesters','course_enrollments','notes','tasks','exams','grades']
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t || '_updated_at', t);
  END LOOP;
END $$;
