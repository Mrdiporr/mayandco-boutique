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
  channel: z.enum(["transfer", "whatsapp"]),
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

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const slugs = [...new Set(data.items.map((i) => i.slug))];
    const [{ data: products }, { data: settings }] = await Promise.all([
      sb.from("products").select("slug, name, price").in("slug", slugs).eq("active", true),
      sb.from("store_settings").select("shipping_fee").maybeSingle(),
    ]);

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

    const { data: order, error } = await sb
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
      })
      .select("id, reference")
      .single();
    if (error || !order) throw new Error("Could not save the order. Please try again.");

    await sb.from("order_items").insert(priced.map((l) => ({ ...l, order_id: order.id })));

    return { reference: order.reference, subtotal, shipping, total: subtotal + shipping };
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
