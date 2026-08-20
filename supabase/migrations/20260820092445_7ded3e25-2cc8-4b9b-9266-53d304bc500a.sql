CREATE POLICY "Admins read store images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'store-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload store images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update store images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'store-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete store images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-images' AND public.has_role(auth.uid(), 'admin'));