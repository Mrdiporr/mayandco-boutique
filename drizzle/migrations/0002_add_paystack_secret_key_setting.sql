ALTER TABLE public.store_private_settings ADD COLUMN paystack_secret_key TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.store_private_settings.paystack_secret_key IS 'Paystack secret key (sk_test_/sk_live_) saved by an admin; empty = Paystack disabled. Never returned to clients.';