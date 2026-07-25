
CREATE POLICY "Authenticated can read tour-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can upload tour-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can update tour-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can delete tour-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tour-images');
