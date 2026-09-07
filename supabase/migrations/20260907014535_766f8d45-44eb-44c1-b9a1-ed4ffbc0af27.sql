CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins manage catalogue items" ON public.catalogue_items;
DROP POLICY IF EXISTS "Admins read all catalogue items" ON public.catalogue_items;
CREATE POLICY "Admins manage catalogue items" ON public.catalogue_items FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read all catalogue items" ON public.catalogue_items FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage order lines" ON public.order_items;
DROP POLICY IF EXISTS "Admins read order lines" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can add order lines" ON public.order_items;
CREATE POLICY "Admins manage order lines" ON public.order_items FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read order lines" ON public.order_items FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage product images" ON public.product_images;
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage variants" ON public.product_variants;
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Admins read all products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage requests" ON public.shopper_requests;
DROP POLICY IF EXISTS "Admins read requests" ON public.shopper_requests;
CREATE POLICY "Admins manage requests" ON public.shopper_requests FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read requests" ON public.shopper_requests FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins read store images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload store images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update store images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete store images" ON storage.objects;
CREATE POLICY "Admins read store images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'store-images' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins upload store images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-images' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update store images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'store-images' AND private.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id = 'store-images' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete store images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'store-images' AND private.has_role(auth.uid(),'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon, authenticated;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.order_items FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;