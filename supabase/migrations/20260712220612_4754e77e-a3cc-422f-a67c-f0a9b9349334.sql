-- Explicit admin-only SELECT on questions (defense in depth: student reads happen via service-role server functions that strip correct_index/explanation)
DROP POLICY IF EXISTS "admins read questions" ON public.questions;
CREATE POLICY "admins read questions"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Explicit restrictive policy on exam_sessions writes: no non-admin user may ever INSERT/UPDATE/DELETE via PostgREST. Score writes go through server functions using the service role.
DROP POLICY IF EXISTS "block non-admin exam_sessions writes" ON public.exam_sessions;
CREATE POLICY "block non-admin exam_sessions writes"
  ON public.exam_sessions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Explicit admin-only SELECT on lecture-videos storage objects (students access via signed URLs generated server-side by admin client)
DROP POLICY IF EXISTS "admins read lecture-videos" ON storage.objects;
CREATE POLICY "admins read lecture-videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'lecture-videos' AND private.has_role(auth.uid(), 'admin'::app_role));