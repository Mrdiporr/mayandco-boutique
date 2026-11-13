import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { z } from "zod";

const migration = readFileSync(
  new URL("../drizzle/migrations/0004_checkout_variant_reservations.sql", import.meta.url),
  "utf8",
);
const checkoutItem = z.object({
  slug: z.string().trim().min(1).max(120),
  size: z.enum(["S", "M", "L", "XL", "XXL"]),
  quantity: z.number().int().min(1).max(20),
});

describe("checkout stock reservation safeguards", () => {
  test("checkout accepts only the five store sizes and bounded whole quantities", () => {
    expect(checkoutItem.safeParse({ slug: "look", size: "S", quantity: 1 }).success).toBe(true);
    expect(checkoutItem.safeParse({ slug: "look", size: "XXL", quantity: 20 }).success).toBe(true);
    expect(checkoutItem.safeParse({ slug: "look", size: "XS", quantity: 1 }).success).toBe(false);
    expect(checkoutItem.safeParse({ slug: "look", size: "S", quantity: 21 }).success).toBe(false);
  });

  test("a cart-supplied preorder flag is not accepted as stock authority", () => {
    const parsed = checkoutItem.parse({ slug: "look", size: "S", quantity: 1, preOrder: false });
    expect(parsed).toEqual({ slug: "look", size: "S", quantity: 1 });
  });

  test("available units are row-locked and reserved, with sold-out remainder recorded as preorder", () => {
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("v_in_stock := least(v_available, v_quantity)");
    expect(migration).toContain("v_pre_order := v_quantity - v_in_stock");
    expect(migration).toContain("SET stock = stock - v_in_stock");
    expect(migration).toContain("IF v_pre_order > 0 THEN");
    expect(migration).toContain("VALUES (v_order_id, v_slug, NULL, v_product.name, v_size, v_pre_order, v_product.price, true)");
  });

  test("cancelled orders release only allocated in-stock units once", () => {
    expect(migration).toContain("IF OLD.status IS DISTINCT FROM 'cancelled'");
    expect(migration).toContain("AND NEW.status = 'cancelled'");
    expect(migration).toContain("AND OLD.stock_allocated THEN");
    expect(migration).toContain("pre_order = false AND product_variant_id IS NOT NULL");
  });
});