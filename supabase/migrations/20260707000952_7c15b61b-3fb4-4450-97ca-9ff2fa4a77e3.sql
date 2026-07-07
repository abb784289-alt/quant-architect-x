
CREATE POLICY "auth read lecture videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lecture-videos');
CREATE POLICY "admin write lecture videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lecture-videos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update lecture videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'lecture-videos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete lecture videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lecture-videos' AND public.has_role(auth.uid(),'admin'));
