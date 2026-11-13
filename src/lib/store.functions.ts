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

  // Whether Paystack is configured (admin-saved key first, then the project secret).
  // Only the boolean leaves the server — never the key itself.
  let paystackEnabled = false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: priv } = await supabaseAdmin
      .from("store_private_settings")
      .select("paystack_secret_key")
      .eq("id", true)
      .maybeSingle();
    paystackEnabled = Boolean(priv?.paystack_secret_key?.trim() || process.env["PAYSTACK_SECRET_KEY"]);
  } catch {
    paystackEnabled = false;
  }

  const settings: StoreSettings = {
    whatsappNumber: s?.whatsapp_number ?? "2348148840440",
    bankName: s?.bank_name ?? "",
    accountName: s?.account_name ?? "",
    accountNumber: s?.account_number ?? "",
    shippingFee: s?.shipping_fee ?? 5000,
    transferInstructions: s?.transfer_instructions ?? "",
    instagramHandle: s?.instagram_handle ?? "mayandco.ng",
    enableManualTransfer: s?.enable_manual_transfer ?? true,
    paystackEnabled,
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
  channel: z.enum(["transfer", "whatsapp", "stripe", "paystack"]),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(120),
        size: z.enum(["S", "M", "L", "XL", "XXL"]),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(40),
});

type OrderInput = z.infer<typeof orderInput>;

const createdOrderSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(4).max(40),
  subtotal: z.number().int().nonnegative(),
  shipping: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  lines: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      image: z.string(),
      size: z.enum(["S", "M", "L", "XL", "XXL"]),
      quantity: z.number().int().positive(),
      price: z.number().int().nonnegative(),
      preOrder: z.boolean(),
    }),
  ),
});

/** Server-only: database validates the order, reserves available stock and creates all order rows atomically. */
async function createOrder(data: OrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: result, error } = await supabaseAdmin.rpc("create_store_order", {
    p_customer: data.customer,
    p_channel: data.channel,
    p_items: data.items.map(({ slug, size, quantity }) => ({ slug, size, quantity })),
  });
  if (error || !result) {
    if (error?.code === "P0001") throw new Error(error.message);
    throw new Error("We could not validate and reserve your order. Please refresh your bag and try again.");
  }
  try {
    return createdOrderSchema.parse(result);
  } catch {
    throw new Error("We could not confirm your order details. Please contact the studio before paying.");
  }
}

async function cancelUnpaidOrder(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cancelled } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .is("paid_at", null)
    .select("id")
    .maybeSingle();
  if (cancelled) {
    await supabaseAdmin.from("order_status_events").insert({
      order_id: orderId,
      status: "cancelled",
      note: "Payment checkout could not be started; reserved stock was released.",
    });
  }
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    if (data.channel !== "transfer" && data.channel !== "whatsapp") {
      throw new Error("Use online payment for this option.");
    }
    const result = await createOrder(data);
    return result;
  });

/** Create the order server-side, then open a Stripe Checkout for its server-computed total. */
export const startCardPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    orderInput.extend({ channel: z.literal("stripe") }).parse(data),
  )
  .handler(async ({ data }) => {
    let order: Awaited<ReturnType<typeof createOrder>> | undefined;
    try {
      const { createCheckoutSession } = await import("@/lib/stripe.server");
      const { getRequest } = await import("@tanstack/react-start/server");
      order = await createOrder(data);
      const session = await createCheckoutSession({
        orderReference: order.reference,
        amountKobo: Math.round(order.total * 100),
        email: data.customer.email || undefined,
        origin: new URL(getRequest().url).origin,
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", order.id);
      if (error) throw new Error("Could not link your secure payment session to the order.");
      return { url: session.url, reference: order.reference };
    } catch (error) {
      if (order) await cancelUnpaidOrder(order.id);
      throw error;
    }
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

/** Create the order server-side, then open Paystack's secure payment window (card, transfer, USSD). */
export const startPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    orderInput.extend({ channel: z.literal("paystack") }).parse(data),
  )
  .handler(async ({ data }) => {
    let order: Awaited<ReturnType<typeof createOrder>> | undefined;
    try {
      const { createPaystackReturnProof, initializePaystackPayment } = await import("@/lib/paystack.server");
      order = await createOrder(data);
      const { getRequest } = await import("@tanstack/react-start/server");
      const proof = await createPaystackReturnProof(order.reference);
      const payment = await initializePaystackPayment({
        reference: order.reference,
        amountKobo: Math.round(order.total * 100),
        email: data.customer.email || undefined,
        callbackUrl: `${new URL(getRequest().url).origin}/checkout/callback?via=paystack`,
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ paystack_reference: payment.reference })
        .eq("id", order.id);
      if (error) throw new Error("Could not link your secure payment to the order.");
      return {
        url: payment.authorizationUrl,
        reference: order.reference,
        proof,
      };
    } catch (error) {
      if (order) await cancelUnpaidOrder(order.id);
      throw error;
    }
  });

/** Called from the Paystack return page; re-verifies with Paystack before trusting anything. */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        reference: z.string().trim().min(6).max(100),
        proof: z.string().regex(/^[a-f0-9]{128}$/i),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { confirmPaystackPayment, verifyPaystackReturnProof } =
      await import("@/lib/paystack.server");
    if (!(await verifyPaystackReturnProof(data.reference, data.proof))) {
      return { found: false as const };
    }
    const result = await confirmPaystackPayment(data.reference);
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
