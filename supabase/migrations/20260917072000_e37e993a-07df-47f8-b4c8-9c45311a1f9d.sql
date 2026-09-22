CREATE TABLE public.student_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  title text NOT NULL,
  course_code text,
  course_name text,
  category text,
  description text,
  due_at timestamp with time zone,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Not started',
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_tasks TO authenticated;
GRANT ALL ON public.student_tasks TO service_role;

ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON public.student_tasks
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE TABLE public.academic_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  milestone_type text NOT NULL DEFAULT 'Assignment',
  title text NOT NULL,
  description text,
  course_code text,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_milestones TO authenticated;
GRANT ALL ON public.academic_milestones TO service_role;

ALTER TABLE public.academic_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own milestones" ON public.academic_milestones
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER student_tasks_touch_updated_at
  BEFORE UPDATE ON public.student_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER academic_milestones_touch_updated_at
  BEFORE UPDATE ON public.academic_milestones
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX student_tasks_student_due_idx ON public.student_tasks (student_id, due_at);
CREATE INDEX academic_milestones_student_start_idx ON public.academic_milestones (student_id, starts_at);