ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_reference text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_note text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS orders_paystack_reference_key ON public.orders(paystack_reference) WHERE paystack_reference IS NOT NULL;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS enable_manual_transfer boolean NOT NULL DEFAULT true;

CREATE TABLE public.order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_events_order_idx ON public.order_status_events(order_id, created_at);
GRANT SELECT ON public.order_status_events TO authenticated;
GRANT ALL ON public.order_status_events TO service_role;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read status events" ON public.order_status_events FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.order_lookup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_lookup_attempts_key_idx ON public.order_lookup_attempts(key, created_at);
GRANT ALL ON public.order_lookup_attempts TO service_role;
ALTER TABLE public.order_lookup_attempts ENABLE ROW LEVEL SECURITY;