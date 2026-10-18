/** Pure helpers for Paystack payments and order tracking (safe for tests and any runtime). */

export async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True only when the x-paystack-signature header matches HMAC-SHA512(rawBody, secret). */
export async function isValidPaystackSignature(
  secret: string,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!secret || !signature) return false;
  const expected = await hmacSha512Hex(secret, rawBody);
  return timingSafeEqualHex(expected, signature.trim().toLowerCase());
}

/** Paystack amounts are in kobo; order totals are whole naira. */
export const toKobo = (naira: number) => Math.round(naira * 100);

/** A payment is acceptable only if it succeeded, in NGN, for exactly the order total. */
export function paymentMatchesOrder(
  tx: { status?: string; amount?: number; currency?: string },
  orderTotalNaira: number,
): boolean {
  return (
    tx.status === "success" &&
    (tx.currency ?? "NGN").toUpperCase() === "NGN" &&
    tx.amount === toKobo(orderTotalNaira)
  );
}

/** Normalise Nigerian phone numbers so 0814..., +234814..., 234814... all match. */
export function normalisePhone(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

export const TRACKING_STAGES = ["received", "paid", "processing", "shipped", "delivered"] as const;
export type TrackingStage = (typeof TRACKING_STAGES)[number];

/** Map a stored order status to the customer-facing timeline stage. */
export function stageForStatus(status: string): TrackingStage | "cancelled" {
  switch (status) {
    case "paid":
      return "paid";
    case "processing":
      return "processing";
    case "shipped":
      return "shipped";
    case "delivered":
    case "fulfilled":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "received";
  }
}
