/** Paystack API client (server-only). Amounts go in kobo; totals are whole naira. */

import {
  createPaystackReturnProof as createReturnProof,
  isValidPaystackReturnProof,
  paymentMatchesOrder,
} from "@/lib/paystack";

const API = "https://api.paystack.co";

/** Key from admin settings first, then the project secret as a fallback. */
async function secretKey(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("store_private_settings")
    .select("paystack_secret_key")
    .eq("id", true)
    .maybeSingle();
  const key = data?.paystack_secret_key?.trim() || process.env["PAYSTACK_SECRET_KEY"] || "";
  if (!key) throw new Error("Online payments are not set up yet. Please use bank transfer.");
  return key;
}

/** Issue a proof that lets only this checkout return page read its payment result. */
export async function createPaystackReturnProof(reference: string): Promise<string> {
  return createReturnProof(await secretKey(), reference);
}

/** Check the buyer's reference-bound proof before any privileged order lookup. */
export async function verifyPaystackReturnProof(reference: string, proof: string): Promise<boolean> {
  try {
    return await isValidPaystackReturnProof(await secretKey(), reference, proof);
  } catch {
    return false;
  }
}

async function paystack(
  path: string,
  init: { method?: string; json?: unknown } = {},
): Promise<any | null> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await secretKey()}`,
      ...(init.json ? { "Content-Type": "application/json" } : {}),
    },
    body: init.json ? JSON.stringify(init.json) : null,
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || json?.status === false) {
    console.error("Paystack error", res.status, json?.message);
    return null;
  }
  return json;
}

/** Start a Paystack transaction for the server-computed total; returns the hosted payment link. */
export async function initializePaystackPayment(input: {
  reference: string;
  amountKobo: number;
  email?: string | undefined;
  callbackUrl: string;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const res = await paystack("/transaction/initialize", {
    method: "POST",
    json: {
      reference: input.reference,
      amount: input.amountKobo,
      currency: "NGN",
      email: input.email || undefined,
      callback_url: input.callbackUrl,
      metadata: { order_reference: input.reference },
    },
  });
  const url: string | undefined = res?.data?.authorization_url;
  const reference: string | undefined = res?.data?.reference;
  if (!url || !reference) {
    throw new Error("Could not start the payment. Please try again or use bank transfer.");
  }
  return { authorizationUrl: url, reference };
}

/** Re-check the transaction with Paystack before trusting any payment status. */
export async function verifyPaystackTransaction(reference: string) {
  const res = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  return (res?.data ?? null) as { status?: string; amount?: number; currency?: string } | null;
}

/** Lightweight key check used by admin settings before saving (works with sk_test_/sk_live_). */
export async function checkPaystackKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/transaction?perPage=1`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const json = (await res.json().catch(() => null)) as any;
    return res.ok && json?.status !== false;
  } catch {
    return false;
  }
}

/**
 * Mark the order paid exactly once — used by both the webhook and the return page.
 * The transaction is re-verified with Paystack and the amount must match the
 * server-computed order total before anything is written.
 */
export async function confirmPaystackPayment(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: byPaystackRef } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, status, paid_at")
    .eq("paystack_reference", reference)
    .maybeSingle();
  const order =
    byPaystackRef ??
    (
      await supabaseAdmin
        .from("orders")
        .select("id, reference, total, status, paid_at")
        .eq("reference", reference)
        .maybeSingle()
    ).data;
  if (!order) return null;
  if (order.paid_at) return { ...order, paid: true };
  if (order.status === "cancelled") return { ...order, paid: false };

  const tx = await verifyPaystackTransaction(reference);
  if (!tx || !paymentMatchesOrder(tx, order.total)) return { ...order, paid: false };

  const paidAt = new Date().toISOString();
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", order.id)
    .is("paid_at", null)
    .neq("status", "cancelled")
    .select("id")
    .maybeSingle();
  if (updated) {
    await supabaseAdmin
      .from("order_status_events")
      .insert({ order_id: order.id, status: "paid", note: "Payment confirmed by Paystack" });
    return { ...order, status: "paid", paid_at: paidAt, paid: true };
  }
  const { data: latest } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, status, paid_at")
    .eq("id", order.id)
    .maybeSingle();
  return latest ? { ...latest, paid: Boolean(latest.paid_at) } : null;
}
