
-- Hide exam answer keys: only safe columns readable by students; correct_index & explanation stay server-only
REVOKE SELECT ON public.questions FROM authenticated, anon;
GRANT SELECT (id, section_id, prompt, choices, order_index, created_at) ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

-- Prevent students from tampering with their exam session scores via direct API.
-- All writes must go through server functions using the service role.
REVOKE INSERT, UPDATE, DELETE ON public.exam_sessions FROM authenticated, anon;
GRANT SELECT ON public.exam_sessions TO authenticated;
GRANT ALL ON public.exam_sessions TO service_role;

-- Remove the broad lecture-videos read policy: clients must access videos via
-- short-lived signed URLs generated server-side, not by direct storage reads.
DROP POLICY IF EXISTS "auth read lecture videos" ON storage.objects;
