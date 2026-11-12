ALTER TABLE public.orders
  ADD COLUMN stock_allocated boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.create_store_order(p_customer jsonb, p_channel text, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_order_id uuid;
  v_reference text;
  v_shipping integer := 5000;
  v_manual_transfer boolean := true;
  v_subtotal integer := 0;
  v_stock_allocated boolean := false;
  v_has_pre_order boolean := false;
  v_item jsonb;
  v_slug text;
  v_size text;
  v_quantity integer;
  v_product record;
  v_variant_id uuid;
  v_available integer := 0;
  v_in_stock integer;
  v_pre_order integer;
  v_lines jsonb;
BEGIN
  IF jsonb_typeof(p_customer) <> 'object' OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 40 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Your checkout details are incomplete. Please review your bag and try again.';
  END IF;

  IF p_channel NOT IN ('transfer', 'whatsapp', 'stripe', 'paystack') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'This checkout option is unavailable.';
  END IF;

  IF length(btrim(coalesce(p_customer->>'name', ''))) < 1
     OR length(coalesce(p_customer->>'name', '')) > 120
     OR length(regexp_replace(coalesce(p_customer->>'phone', ''), '[^0-9]', '', 'g')) < 7
     OR length(coalesce(p_customer->>'email', '')) > 255
     OR length(coalesce(p_customer->>'address', '')) > 300
     OR length(coalesce(p_customer->>'city', '')) > 100
     OR length(coalesce(p_customer->>'state', '')) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Please check your name, phone number, and delivery details.';
  END IF;

  SELECT shipping_fee, enable_manual_transfer
    INTO v_shipping, v_manual_transfer
    FROM public.store_settings
    WHERE id = true
    FOR SHARE;
  v_shipping := coalesce(v_shipping, 5000);
  IF p_channel = 'transfer' AND v_manual_transfer = false THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Manual bank transfer is turned off. Please pay online.';
  END IF;

  v_reference := 'MC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  INSERT INTO public.orders (
    reference, customer_name, email, phone, address, city, state, channel,
    status, subtotal, shipping, total, has_pre_order, stock_allocated
  ) VALUES (
    v_reference,
    btrim(p_customer->>'name'),
    coalesce(p_customer->>'email', ''),
    btrim(p_customer->>'phone'),
    coalesce(p_customer->>'address', ''),
    coalesce(p_customer->>'city', ''),
    coalesce(p_customer->>'state', ''),
    p_channel,
    CASE WHEN p_channel = 'whatsapp' THEN 'awaiting_whatsapp' ELSE 'pending_payment' END,
    0, v_shipping, v_shipping, false, false
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_slug := btrim(coalesce(v_item->>'slug', ''));
    v_size := upper(btrim(coalesce(v_item->>'size', '')));
    IF v_slug = '' OR length(v_slug) > 120
       OR v_size NOT IN ('S', 'M', 'L', 'XL', 'XXL')
       OR coalesce(v_item->>'quantity', '') !~ '^[0-9]{1,2}$' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'A piece in your bag has invalid size or quantity. Please review your bag.';
    END IF;
    v_quantity := (v_item->>'quantity')::integer;
    IF v_quantity < 1 OR v_quantity > 20 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Each piece must have a quantity between 1 and 20.';
    END IF;

    SELECT id, name, price, image
      INTO v_product
      FROM public.products
      WHERE slug = v_slug AND active = true
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'A piece in your bag is no longer available. Please refresh the shop and try again.';
    END IF;

    v_variant_id := NULL;
    v_available := 0;
    SELECT id, stock
      INTO v_variant_id, v_available
      FROM public.product_variants
      WHERE product_id = v_product.id AND size = v_size
      FOR UPDATE;
    v_available := greatest(coalesce(v_available, 0), 0);
    v_in_stock := least(v_available, v_quantity);
    v_pre_order := v_quantity - v_in_stock;

    IF v_in_stock > 0 THEN
      UPDATE public.product_variants
        SET stock = stock - v_in_stock
        WHERE id = v_variant_id;
      INSERT INTO public.order_items (order_id, product_slug, name, size, quantity, unit_price, pre_order)
        VALUES (v_order_id, v_slug, v_product.name, v_size, v_in_stock, v_product.price, false);
      v_subtotal := v_subtotal + (v_product.price * v_in_stock);
      v_stock_allocated := true;
    END IF;

    IF v_pre_order > 0 THEN
      INSERT INTO public.order_items (order_id, product_slug, name, size, quantity, unit_price, pre_order)
        VALUES (v_order_id, v_slug, v_product.name, v_size, v_pre_order, v_product.price, true);
      v_subtotal := v_subtotal + (v_product.price * v_pre_order);
      v_has_pre_order := true;
    END IF;
  END LOOP;

  UPDATE public.orders
    SET subtotal = v_subtotal,
        total = v_subtotal + v_shipping,
        has_pre_order = v_has_pre_order,
        stock_allocated = v_stock_allocated
    WHERE id = v_order_id;

  INSERT INTO public.order_status_events (order_id, status, note)
    VALUES (v_order_id, 'received', '');

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'slug', line.product_slug,
        'name', line.name,
        'image', coalesce(line.image, ''),
        'size', line.size,
        'quantity', line.quantity,
        'price', line.unit_price,
        'preOrder', line.pre_order
      ) ORDER BY line.name, line.size, line.pre_order
    ),
    '[]'::jsonb
  )
  INTO v_lines
  FROM (
    SELECT oi.product_slug, oi.name, p.image, oi.size,
           sum(oi.quantity)::integer AS quantity, oi.unit_price, oi.pre_order
    FROM public.order_items AS oi
    LEFT JOIN public.products AS p ON p.slug = oi.product_slug
    WHERE oi.order_id = v_order_id
    GROUP BY oi.product_slug, oi.name, p.image, oi.size, oi.unit_price, oi.pre_order
  ) AS line;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'reference', v_reference,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_subtotal + v_shipping,
    'lines', v_lines
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_store_order(jsonb, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_order(jsonb, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.release_order_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM 'cancelled'
     AND NEW.status = 'cancelled'
     AND OLD.stock_allocated THEN
    UPDATE public.product_variants AS pv
      SET stock = pv.stock + reserved.quantity
      FROM (
        SELECT p.id AS product_id, oi.size, sum(oi.quantity)::integer AS quantity
        FROM public.order_items AS oi
        JOIN public.products AS p ON p.slug = oi.product_slug
        WHERE oi.order_id = OLD.id AND oi.pre_order = false
        GROUP BY p.id, oi.size
      ) AS reserved
      WHERE pv.product_id = reserved.product_id AND pv.size = reserved.size;
    NEW.stock_allocated := false;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.release_order_stock_on_cancel() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_release_stock_on_cancel
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.release_order_stock_on_cancel();
