
REVOKE SELECT (correct_index, explanation) ON public.questions FROM authenticated;
GRANT SELECT (id, section_id, prompt, choices, order_index) ON public.questions TO authenticated;

DROP POLICY IF EXISTS "section-videos authenticated read" ON storage.objects;
CREATE POLICY "section-videos entitled read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'section-videos' AND (
      private.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.sections s
        WHERE s.video_path = storage.objects.name
          AND (
            s.is_free = true
            OR EXISTS (
              SELECT 1 FROM public.section_enrollments se
              WHERE se.section_id = s.id AND se.user_id = auth.uid()
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "lecture-videos entitled read" ON storage.objects;
CREATE POLICY "lecture-videos entitled read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lecture-videos' AND EXISTS (
      SELECT 1 FROM public.sections s
      WHERE s.video_path = storage.objects.name
        AND (
          s.is_free = true
          OR EXISTS (
            SELECT 1 FROM public.section_enrollments se
            WHERE se.section_id = s.id AND se.user_id = auth.uid()
          )
        )
    )
  );
