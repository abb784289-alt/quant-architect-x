-- Explicit admin-only write policies on exam_sessions (belt-and-suspenders on top of fail-closed RLS).
-- Client-side writes are fully blocked for non-admins; server functions use the service role.
DROP POLICY IF EXISTS "admins insert sessions" ON public.exam_sessions;
CREATE POLICY "admins insert sessions"
  ON public.exam_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admins update sessions" ON public.exam_sessions;
CREATE POLICY "admins update sessions"
  ON public.exam_sessions
  FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admins delete sessions" ON public.exam_sessions;
CREATE POLICY "admins delete sessions"
  ON public.exam_sessions
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Explicit admin-only SELECT policy on the lecture-videos storage bucket.
-- Students never SELECT directly; they receive short-lived signed URLs from the server.
DROP POLICY IF EXISTS "admins read lecture videos" ON storage.objects;
CREATE POLICY "admins read lecture videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'lecture-videos' AND private.has_role(auth.uid(), 'admin'::app_role));