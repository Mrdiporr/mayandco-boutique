import { paymentMatchesOrder } from "@/lib/paystack";

const API = "https://api.paystack.co";

function secret() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("Card payments are not set up yet. Please use bank transfer.");
  return key;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | { status?: boolean; data?: { authorization_url?: string } }
    | null;
  if (!res.ok || !json?.status || !json.data?.authorization_url) {
    throw new Error("Could not start the payment. Please try again.");
  }
  return json.data.authorization_url;
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const json = (await res.json().catch(() => null)) as
    | { status?: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string } }
    | null;
  if (!res.ok || !json?.status || !json.data) return null;
  return json.data;
}

/**
 * Verify a Paystack reference with Paystack itself and, if the amount matches the
 * stored order total, mark the order paid exactly once. Returns the order state.
 */
export async function confirmPaystackPayment(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, status, paid_at")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order) return null;
  if (order.paid_at) return { ...order, paid: true };

  const tx = await verifyTransaction(reference);
  if (!tx || !paymentMatchesOrder(tx, order.total)) return { ...order, paid: false };

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
      .insert({ order_id: order.id, status: "paid", note: "Payment confirmed by Paystack" });
  }
  return { ...order, status: "paid", paid_at: paidAt, paid: true };
}
