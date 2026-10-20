CREATE TABLE public.store_private_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  stripe_secret_key text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.store_private_settings TO authenticated;
GRANT ALL ON public.store_private_settings TO service_role;
ALTER TABLE public.store_private_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read private settings" ON public.store_private_settings FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert private settings" ON public.store_private_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update private settings" ON public.store_private_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
INSERT INTO public.store_private_settings (id) VALUES (true);
ALTER TABLE public.orders ADD COLUMN stripe_session_id text;
CREATE UNIQUE INDEX orders_stripe_session_id_key ON public.orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;