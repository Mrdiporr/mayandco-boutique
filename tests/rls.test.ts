import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

// Regression tests for the five intended public RLS policies.
// See docs/security/intended-rls-policies.md. Run: bun test ./tests/rls.test.ts
// Calls the REST API as an anonymous visitor (publishable key from .env).

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const H = { apikey: KEY, "Content-Type": "application/json" };
const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });

const MARKER = `[rls-test] ${Date.now()}`;

// Note: anon cannot delete, so each run leaves one "[rls-test]" request visible in /admin > Requests.

test.each(["product_variants", "categories", "store_settings", "product_images"])(
  "anon can read %s",
  async (table) => {
    const r = await rest(`${table}?select=*&limit=1`);
    expect(r.status).toBe(200);
    const rows = await r.json();
    if (table !== "product_images") expect(rows.length).toBeGreaterThan(0);
  },
);

test("anon can submit a shopper request but cannot read requests", async () => {
  const ins = await rest("shopper_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ name: MARKER, message: "automated RLS test" }),
  });
  expect(ins.status).toBe(201);
  const read = await rest("shopper_requests?select=id&limit=1");
  expect(await read.json()).toEqual([]);
});

test("anon cannot modify store settings or categories", async () => {
  const up = await rest("store_settings?id=eq.true", {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ bank_name: "hacked" }),
  });
  if (up.status === 200) expect(await up.json()).toEqual([]);
  else expect(up.status).toBeGreaterThanOrEqual(401);

  const cat = await rest("categories", {
    method: "POST",
    body: JSON.stringify({ slug: "rls-test", name: "x" }),
  });
  expect(cat.status).toBeGreaterThanOrEqual(401);
});

test("anon cannot insert or read orders", async () => {
  const ins = await rest("orders", {
    method: "POST",
    body: JSON.stringify({ reference: "RLS", customer_name: "x" }),
  });
  expect(ins.status).toBeGreaterThanOrEqual(401);
  const read = await rest("orders?select=id&limit=1");
  if (read.status === 200) expect(await read.json()).toEqual([]);
});
