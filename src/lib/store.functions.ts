import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicSupabase } from "@/lib/supabase-public.server";
import { mapProduct, type RawProduct } from "@/lib/store.mappers";
import type { CatalogueItem, CategoryRecord, Product, StoreSettings } from "@/lib/products";

const PRODUCT_SELECT =
  "id, slug, name, price, category_slug, image, editorial, details, is_new, position, product_variants(size, stock)";

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicSupabase();
  const [productsRes, categoriesRes, settingsRes] = await Promise.all([
    sb.from("products").select(PRODUCT_SELECT).eq("active", true).order("position"),
    sb.from("categories").select("id, slug, name, position").order("position"),
    sb.from("store_settings").select("*").maybeSingle(),
  ]);

  const products: Product[] = (productsRes.data ?? []).map((row) =>
    mapProduct(row as unknown as RawProduct),
  );
  const categories: CategoryRecord[] = (categoriesRes.data ?? []) as CategoryRecord[];
  const s = settingsRes.data;
  const settings: StoreSettings = {
    whatsappNumber: s?.whatsapp_number ?? "2348148840440",
    bankName: s?.bank_name ?? "",
    accountName: s?.account_name ?? "",
    accountNumber: s?.account_number ?? "",
    shippingFee: s?.shipping_fee ?? 5000,
    transferInstructions: s?.transfer_instructions ?? "",
    instagramHandle: s?.instagram_handle ?? "mayandco.ng",
    enableManualTransfer: s?.enable_manual_transfer ?? true,
  };
  return { products, categories, settings };
});

export const getCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicSupabase();
  const { data } = await sb
    .from("catalogue_items")
    .select("id, title, tag, note, image, position")
    .eq("visible", true)
    .order("position");
  return (data ?? []) as CatalogueItem[];
});

const orderInput = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().max(255).email().or(z.literal("")),
    phone: z.string().trim().min(7).max(30),
    address: z.string().trim().max(300).default(""),
    city: z.string().trim().max(100).default(""),
    state: z.string().trim().max(100).default(""),
  }),
  channel: z.enum(["transfer", "whatsapp", "stripe"]),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(120),
        size: z.string().trim().max(10).default(""),
        quantity: z.number().int().min(1).max(20),
        preOrder: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(40),
});

type OrderInput = z.infer<typeof orderInput>;

/** Server-only: price items from the database and write the order with the service role. */
async function createOrder(data: OrderInput, extra: { paystackReference?: string } = {}) {
  const sb = publicSupabase();
  const slugs = [...new Set(data.items.map((i) => i.slug))];
  const [{ data: products }, { data: settings }] = await Promise.all([
    sb.from("products").select("slug, name, price").in("slug", slugs).eq("active", true),
    sb.from("store_settings").select("shipping_fee, enable_manual_transfer").maybeSingle(),
  ]);
  if (data.channel === "transfer" && settings?.enable_manual_transfer === false) {
    throw new Error("Manual bank transfer is turned off. Please pay online.");
  }

  const priced = data.items.flatMap((item) => {
    const product = (products ?? []).find((p) => p.slug === item.slug);
    if (!product) return [];
    return [
      {
        product_slug: product.slug,
        name: product.name,
        size: item.size,
        quantity: item.quantity,
        unit_price: product.price,
        pre_order: item.preOrder,
      },
    ];
  });
  if (priced.length === 0) throw new Error("No valid items in this order.");

  const subtotal = priced.reduce((n, l) => n + l.unit_price * l.quantity, 0);
  const shipping = settings?.shipping_fee ?? 5000;
  const reference = `MC-${Date.now().toString(36).toUpperCase()}`;

  // Orders are written with the service role: prices/totals are computed here,
  // and no public API caller can insert or tamper with order rows.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      reference,
      customer_name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      address: data.customer.address,
      city: data.customer.city,
      state: data.customer.state,
      channel: data.channel,
      status: data.channel === "whatsapp" ? "awaiting_whatsapp" : "pending_payment",
      subtotal,
      shipping,
      total: subtotal + shipping,
      has_pre_order: priced.some((l) => l.pre_order),
      paystack_reference: extra.paystackReference ?? null,
    })
    .select("id, reference")
    .single();
  if (error || !order) throw new Error("Could not save the order. Please try again.");

  await Promise.all([
    supabaseAdmin.from("order_items").insert(priced.map((l) => ({ ...l, order_id: order.id }))),
    supabaseAdmin
      .from("order_status_events")
      .insert({ order_id: order.id, status: "received", note: "" }),
  ]);

  return { id: order.id, reference: order.reference, subtotal, shipping, total: subtotal + shipping };
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    if (data.channel === "stripe") throw new Error("Use online payment for this option.");
    const { id: _id, ...result } = await createOrder(data);
    return result;
  });

/** Create the order server-side, then open a Stripe Checkout for its server-computed total. */
export const startCardPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    orderInput.extend({ channel: z.literal("stripe") }).parse(data),
  )
  .handler(async ({ data }) => {
    const { createCheckoutSession } = await import("@/lib/stripe.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const order = await createOrder(data);
    const session = await createCheckoutSession({
      orderReference: order.reference,
      amountKobo: Math.round(order.total * 100),
      email: data.customer.email || undefined,
      origin: new URL(getRequest().url).origin,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return { url: session.url, reference: order.reference };
  });

/** Called from the Stripe return page; re-verifies with Stripe before trusting anything. */
export const verifyCardPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ sessionId: z.string().trim().min(8).max(255) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { confirmStripePayment } = await import("@/lib/stripe.server");
    const result = await confirmStripePayment(data.sessionId);
    if (!result) return { found: false as const };
    return {
      found: true as const,
      paid: result.paid,
      reference: result.reference,
      total: result.total,
    };
  });

const trackInput = z.object({
  reference: z.string().trim().min(4).max(40),
  phone: z.string().trim().min(7).max(30),
});

/** Public order lookup: needs reference AND matching phone; rate-limited; returns no PII. */
export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackInput.parse(data))
  .handler(async ({ data }) => {
    const { normalisePhone, stageForStatus } = await import("@/lib/paystack");
    const { getRequestIP } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const key = `ip:${getRequestIP({ xForwardedFor: true }) ?? "unknown"}`;
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("order_lookup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", since);
    if ((count ?? 0) >= 10) {
      throw new Error("Too many attempts. Please wait 15 minutes and try again.");
    }

    const reference = data.reference.toUpperCase();
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, reference, phone, status, created_at, paid_at, tracking_note, has_pre_order, total")
      .eq("reference", reference)
      .maybeSingle();

    if (!order || normalisePhone(order.phone) !== normalisePhone(data.phone)) {
      await supabaseAdmin.from("order_lookup_attempts").insert({ key });
      return { found: false as const };
    }

    const [{ data: events }, { data: items }] = await Promise.all([
      supabaseAdmin
        .from("order_status_events")
        .select("status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at"),
      supabaseAdmin
        .from("order_items")
        .select("name, size, quantity, pre_order")
        .eq("order_id", order.id),
    ]);

    return {
      found: true as const,
      reference: order.reference,
      stage: stageForStatus(order.status),
      createdAt: order.created_at,
      total: order.total,
      hasPreOrder: order.has_pre_order,
      trackingNote: order.tracking_note ?? "",
      events: (events ?? []).map((e) => ({
        stage: stageForStatus(e.status),
        note: e.note,
        at: e.created_at,
      })),
      items: items ?? [],
    };
  });

const requestInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(30),
  budget: z.string().trim().max(60).default(""),
  sizes: z.string().trim().max(120).default(""),
  message: z.string().trim().max(1000).default(""),
  items: z.array(z.string().trim().max(160)).max(20).default([]),
});

export const submitShopperRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const { error } = await sb.from("shopper_requests").insert({
      name: data.name,
      phone: data.phone,
      budget: data.budget,
      sizes: data.sizes,
      message: data.message,
      items: data.items,
    });
    if (error) throw new Error("Could not send your request. Please try again.");
    return { ok: true };
  });
