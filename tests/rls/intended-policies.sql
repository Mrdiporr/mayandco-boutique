-- Regression tests for the five RLS findings confirmed as intended.
-- Runs inside one transaction and always rolls back: no data is left behind.
\set ON_ERROR_STOP 1
BEGIN;

SET LOCAL ROLE anon;

-- 1. product_variants: public can read stock levels (needed for pre-order toggle + low-stock badges)
DO $$ BEGIN
  IF (SELECT count(*) FROM public.product_variants) = 0 THEN
    RAISE EXCEPTION 'FAIL product_variants: anon cannot read stock';
  END IF;
END $$;

-- 2. categories: public can read navigation categories
DO $$ BEGIN
  IF (SELECT count(*) FROM public.categories) = 0 THEN
    RAISE EXCEPTION 'FAIL categories: anon cannot read';
  END IF;
END $$;

-- 3. store_settings: public can read checkout bank details / WhatsApp number
DO $$ BEGIN
  IF (SELECT count(*) FROM public.store_settings) <> 1 THEN
    RAISE EXCEPTION 'FAIL store_settings: anon cannot read the settings row';
  END IF;
END $$;

-- 4. product_images: public can read gallery image rows
DO $$ BEGIN
  PERFORM 1 FROM public.product_images LIMIT 1; -- must not error
END $$;

-- 5. shopper_requests: public can submit, but never read back
INSERT INTO public.shopper_requests (name, message) VALUES ('[rls-test]', 'rolled back');
DO $$ BEGIN
  IF (SELECT count(*) FROM public.shopper_requests) <> 0 THEN
    RAISE EXCEPTION 'FAIL shopper_requests: anon can read requests';
  END IF;
END $$;

-- Guard rails: public must NOT be able to write catalogue data or touch orders
DO $$ BEGIN
  BEGIN
    UPDATE public.store_settings SET bank_name = 'hacked';
    IF FOUND THEN RAISE EXCEPTION 'FAIL store_settings: anon can update'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.categories (slug, name) VALUES ('rls-test', 'x');
    RAISE EXCEPTION 'FAIL categories: anon can insert';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.orders (reference, customer_name) VALUES ('RLS', 'x');
    RAISE EXCEPTION 'FAIL orders: anon can insert';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF (SELECT count(*) FROM public.orders) <> 0 THEN
    RAISE EXCEPTION 'FAIL orders: anon can read orders';
  END IF;
END $$;

SELECT 'ALL RLS REGRESSION CHECKS PASSED' AS result;
ROLLBACK;
