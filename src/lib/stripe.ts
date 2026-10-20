/** Pure Stripe helpers (safe for tests and any bundle). */
export type StripeSessionLike = {
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
};

/** Only a fully paid NGN session for exactly the stored order total counts as paid. */
export function sessionMatchesOrder(session: StripeSessionLike, orderTotalNaira: number) {
  return (
    session.payment_status === "paid" &&
    (session.currency ?? "").toLowerCase() === "ngn" &&
    session.amount_total === Math.round(orderTotalNaira * 100)
  );
}

export function isStripeSecretKey(key: string) {
  return /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(key.trim());
}
