CREATE TABLE public.user_app_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_app_state TO authenticated;
GRANT ALL ON public.user_app_state TO service_role;

ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own app state"
ON public.user_app_state FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_user_app_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_app_state_touch
BEFORE UPDATE ON public.user_app_state
FOR EACH ROW EXECUTE FUNCTION public.touch_user_app_state();