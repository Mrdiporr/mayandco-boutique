import { describe, expect, test } from "bun:test";
import {
  hmacSha512Hex, isValidPaystackSignature, normalisePhone, paymentMatchesOrder, stageForStatus, toKobo,
} from "../src/lib/paystack";

describe("paystack webhook signature", () => {
  test("accepts correct HMAC-SHA512 and rejects tampered body / missing header", async () => {
    const body = '{"event":"charge.success","data":{"reference":"PS-1"}}';
    const sig = await hmacSha512Hex("sk_test_x", body);
    expect(await isValidPaystackSignature("sk_test_x", body, sig)).toBe(true);
    expect(await isValidPaystackSignature("sk_test_x", body + " ", sig)).toBe(false);
    expect(await isValidPaystackSignature("sk_test_x", body, null)).toBe(false);
    expect(await isValidPaystackSignature("", body, sig)).toBe(false);
  });
});

describe("payment amount check", () => {
  test("only exact NGN success for the order total counts as paid", () => {
    expect(toKobo(44000)).toBe(4_400_000);
    expect(paymentMatchesOrder({ status: "success", amount: 4_400_000, currency: "NGN" }, 44000)).toBe(true);
    expect(paymentMatchesOrder({ status: "success", amount: 4_399_900, currency: "NGN" }, 44000)).toBe(false);
    expect(paymentMatchesOrder({ status: "failed", amount: 4_400_000, currency: "NGN" }, 44000)).toBe(false);
    expect(paymentMatchesOrder({ status: "success", amount: 4_400_000, currency: "USD" }, 44000)).toBe(false);
  });
});

describe("tracking lookup", () => {
  test("phone formats match each other", () => {
    expect(normalisePhone("08148840440")).toBe(normalisePhone("+234 814 884 0440"));
    expect(normalisePhone("2348148840440")).toBe("8148840440");
    expect(normalisePhone("08148840441")).not.toBe(normalisePhone("08148840440"));
  });
  test("statuses map to the customer timeline", () => {
    expect(stageForStatus("pending_payment")).toBe("received");
    expect(stageForStatus("paid")).toBe("paid");
    expect(stageForStatus("fulfilled")).toBe("delivered");
    expect(stageForStatus("cancelled")).toBe("cancelled");
  });
});

import { isStripeSecretKey, sessionMatchesOrder } from "../src/lib/stripe";

describe("stripe payment check", () => {
  test("only a paid NGN session for the exact order total counts", () => {
    expect(sessionMatchesOrder({ payment_status: "paid", amount_total: 4_400_000, currency: "ngn" }, 44000)).toBe(true);
    expect(sessionMatchesOrder({ payment_status: "paid", amount_total: 4_399_900, currency: "ngn" }, 44000)).toBe(false);
    expect(sessionMatchesOrder({ payment_status: "unpaid", amount_total: 4_400_000, currency: "ngn" }, 44000)).toBe(false);
    expect(sessionMatchesOrder({ payment_status: "paid", amount_total: 4_400_000, currency: "usd" }, 44000)).toBe(false);
  });
  test("only Stripe secret keys are accepted in settings", () => {
    expect(isStripeSecretKey("sk_test_abc123")).toBe(true);
    expect(isStripeSecretKey("pk_test_abc123")).toBe(false);
  });
});
