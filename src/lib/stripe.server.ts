import { sessionMatchesOrder } from "@/lib/stripe";

const API = "https://api.stripe.com/v1";

/** Key from admin settings first, then the project secret as a fallback. */
async function secretKey() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("store_private_settings")
    .select("stripe_secret_key")
    .eq("id", true)
    .maybeSingle();
  const key =
    data?.stripe_secret_key?.trim() ||
    process.env["STRIPE_TEST_API_KEY"] ||
    process.env["STRIPE_SECRET_KEY"] ||
    "";
  if (!key) throw new Error("Card payments are not set up yet. Please use bank transfer.");
  return key;
}

async function stripe(path: string, init: { method?: string; form?: URLSearchParams } = {}) {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await secretKey()}`,
      ...(init.form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init.form?.toString(),
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    console.error("Stripe error", res.status, json?.error?.message);
    return null;
  }
  return json;
}

export async function createCheckoutSession(input: {
  orderReference: string;
  amountKobo: number;
  email?: string;
  origin: string;
}) {
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "ngn");
  form.set("line_items[0][price_data][unit_amount]", String(input.amountKobo));
  form.set("line_items[0][price_data][product_data][name]", `MAY & CO. order ${input.orderReference}`);
  form.set("client_reference_id", input.orderReference);
  form.set("metadata[order_reference]", input.orderReference);
  if (input.email) form.set("customer_email", input.email);
  form.set(
    "success_url",
    `${input.origin}/checkout/callback?session_id={CHECKOUT_SESSION_ID}`,
  );
  form.set("cancel_url", `${input.origin}/checkout`);
  const session = await stripe("/checkout/sessions", { method: "POST", form });
  if (!session?.id || !session?.url) {
    throw new Error("Could not start the card payment. Please try again or use bank transfer.");
  }
  return { id: session.id as string, url: session.url as string };
}

/** Re-check the session with Stripe; mark the order paid exactly once if the amount matches. */
export async function confirmStripePayment(sessionId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, status, paid_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (!order) return null;
  if (order.paid_at) return { ...order, paid: true };

  const session = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (!session || !sessionMatchesOrder(session, order.total)) return { ...order, paid: false };

  const paidAt = new Date().toISOString();
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", order.id)
    .is("paid_at", null)
    .select("id")
    .maybeSingle();
  if (updated) {
    await supabaseAdmin
      .from("order_status_events")
      .insert({ order_id: order.id, status: "paid", note: "Payment confirmed by Stripe" });
  }
  return { ...order, status: "paid", paid_at: paidAt, paid: true };
}
