ALTER TABLE public.custom_courses
  ADD COLUMN IF NOT EXISTS faculty text,
  ADD COLUMN IF NOT EXISTS lecturer text,
  ADD COLUMN IF NOT EXISTS day text,
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS room text,
  ADD COLUMN IF NOT EXISTS counts_toward_graduation boolean NOT NULL DEFAULT true;