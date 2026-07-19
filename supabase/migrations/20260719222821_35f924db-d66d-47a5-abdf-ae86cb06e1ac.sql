-- 1) Restrict question_bank SELECT to admins (was: any authenticated). Students receive
--    a scrubbed copy via server function, and grading runs server-side.
DROP POLICY IF EXISTS "authenticated read bank" ON public.question_bank;
CREATE POLICY "admins read bank" ON public.question_bank
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- 2) Lecture-video access: add per-section enrollment gate. Sections default to
--    is_free=true so current behaviour is preserved; admins can flip a section to
--    require enrollment, and the getSection server fn will only hand out a signed
--    video URL to admin/enrolled/free.
ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.section_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_id)
);

GRANT SELECT ON public.section_enrollments TO authenticated;
GRANT ALL ON public.section_enrollments TO service_role;

ALTER TABLE public.section_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own enrollments" ON public.section_enrollments;
CREATE POLICY "users read own enrollments" ON public.section_enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage enrollments" ON public.section_enrollments;
CREATE POLICY "admins manage enrollments" ON public.section_enrollments
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- 3) Reply-video ownership: allow a student to read only reply-video objects that
--    are referenced by one of their own student_questions rows.
DROP POLICY IF EXISTS "students read own reply videos" ON storage.objects;
CREATE POLICY "students read own reply videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reply-videos'
    AND EXISTS (
      SELECT 1 FROM public.student_questions sq
      WHERE sq.reply_video_path = storage.objects.name
        AND sq.user_id = auth.uid()
    )
  );
