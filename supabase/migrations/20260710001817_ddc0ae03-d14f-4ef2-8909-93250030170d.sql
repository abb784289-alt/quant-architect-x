
-- Remove permissive authenticated SELECT on questions; reads happen server-side via service role
DROP POLICY IF EXISTS "authenticated read questions" ON public.questions;

-- Remove student UPDATE policy on exam_sessions; all writes go through server functions (service role)
DROP POLICY IF EXISTS "users update own sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "users insert own sessions" ON public.exam_sessions;

-- Explicit storage.objects policies for the private 'lecture-videos' bucket.
-- Direct client access is admin-only; students receive short-lived signed URLs from the server.
DROP POLICY IF EXISTS "admins manage lecture videos" ON storage.objects;
CREATE POLICY "admins manage lecture videos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'lecture-videos' AND private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'lecture-videos' AND private.has_role(auth.uid(), 'admin'::app_role));
