
CREATE POLICY "section-videos admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'section-videos' AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "section-videos admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'section-videos' AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'section-videos' AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "section-videos admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'section-videos' AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "section-videos authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'section-videos');
