ALTER TABLE public.student_profile
ADD COLUMN IF NOT EXISTS avatar_path text;

DROP POLICY IF EXISTS "Users view own profile photos" ON storage.objects;
CREATE POLICY "Users view own profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users upload own profile photos" ON storage.objects;
CREATE POLICY "Users upload own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own profile photos" ON storage.objects;
CREATE POLICY "Users update own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own profile photos" ON storage.objects;
CREATE POLICY "Users delete own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);