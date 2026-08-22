import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sizeSchema = z.enum(["S", "M", "L", "XL", "XXL"]);

const productInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(1).max(160),
  price: z.number().int().min(0).max(100_000_000),
  categorySlug: z.string().trim().min(1).max(60),
  image: z.string().trim().min(1).max(2000),
  editorial: z.string().trim().max(2000).default(""),
  details: z.array(z.string().trim().max(200)).max(12).default([]),
  isNew: z.boolean().default(false),
  active: z.boolean().default(true),
  position: z.number().int().min(0).max(9999).default(0),
  stock: z.record(sizeSchema, z.number().int().min(0).max(9999)),
});

const catalogueInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  tag: z.string().trim().max(60).default(""),
  note: z.string().trim().max(600).default(""),
  image: z.string().trim().min(1).max(2000),
  visible: z.boolean().default(true),
  position: z.number().int().min(0).max(9999).default(0),
});

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(80),
  position: z.number().int().min(0).max(999).default(0),
});

const settingsInput = z.object({
  whatsappNumber: z.string().trim().min(7).max(30),
  bankName: z.string().trim().max(120).default(""),
  accountName: z.string().trim().max(120).default(""),
  accountNumber: z.string().trim().max(40).default(""),
  shippingFee: z.number().int().min(0).max(10_000_000),
  transferInstructions: z.string().trim().max(1000).default(""),
  instagramHandle: z.string().trim().max(80).default(""),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const getAdminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { userId: context.userId, isAdmin: Boolean(data) };
  });

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [products, categories, catalogue, orders, orderItems, requests, settings] =
      await Promise.all([
        sb
          .from("products")
          .select(
            "id, slug, name, price, category_slug, image, editorial, details, is_new, active, position, product_variants(size, stock)",
          )
          .order("position"),
        sb.from("categories").select("*").order("position"),
        sb.from("catalogue_items").select("*").order("position"),
        sb.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
        sb.from("order_items").select("*"),
        sb.from("shopper_requests").select("*").order("created_at", { ascending: false }).limit(200),
        sb.from("store_settings").select("*").maybeSingle(),
      ]);

    return {
      products: products.data ?? [],
      categories: categories.data ?? [],
      catalogue: catalogue.data ?? [],
      orders: orders.data ?? [],
      orderItems: orderItems.data ?? [],
      requests: requests.data ?? [],
      settings: settings.data ?? null,
    };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const row = {
      slug: data.slug,
      name: data.name,
      price: data.price,
      category_slug: data.categorySlug,
      image: data.image,
      editorial: data.editorial,
      details: data.details,
      is_new: data.isNew,
      active: data.active,
      position: data.position,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await sb.from("products").update(row).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await sb
        .from("products")
        .insert(row)
        .select("id")
        .single();
      if (error || !inserted) throw new Error(error?.message ?? "Could not create product");
      productId = inserted.id;
    }

    await sb.from("product_variants").delete().eq("product_id", productId);
    const variants = Object.entries(data.stock).map(([size, stock]) => ({
      product_id: productId,
      size,
      stock: stock ?? 0,
    }));
    if (variants.length) {
      const { error } = await sb.from("product_variants").insert(variants);
      if (error) throw new Error(error.message);
    }
    return { id: productId };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("product_variants").delete().eq("product_id", data.id);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => categoryInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = { slug: data.slug, name: data.name, position: data.position };
    const { error } = data.id
      ? await context.supabase.from("categories").update(row).eq("id", data.id)
      : await context.supabase.from("categories").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCatalogueItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => catalogueInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      title: data.title,
      tag: data.tag,
      note: data.note,
      image: data.image,
      visible: data.visible,
      position: data.position,
    };
    const { error } = data.id
      ? await context.supabase.from("catalogue_items").update(row).eq("id", data.id)
      : await context.supabase.from("catalogue_items").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCatalogueItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("catalogue_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderCatalogue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ items: z.array(z.object({ id: z.string().uuid(), position: z.number().int() })).max(200) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    for (const item of data.items) {
      await context.supabase
        .from("catalogue_items")
        .update({ position: item.position })
        .eq("id", item.id);
    }
    return { ok: true };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending_payment",
          "awaiting_whatsapp",
          "paid",
          "fulfilled",
          "cancelled",
        ]),
        adminNotes: z.string().trim().max(1000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status, admin_notes: data.adminNotes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["new", "quoted", "closed"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("shopper_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("store_settings").update({
      whatsapp_number: data.whatsappNumber,
      bank_name: data.bankName,
      account_name: data.accountName,
      account_number: data.accountNumber,
      shipping_fee: data.shippingFee,
      transfer_instructions: data.transferInstructions,
      instagram_handle: data.instagramHandle,
    }).eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadStoreImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        filename: z.string().trim().min(1).max(160),
        contentType: z.string().trim().max(100),
        base64: z.string().min(1).max(12_000_000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const path = `${Date.now()}-${safeName}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("store-images")
      .upload(path, bytes, { contentType: data.contentType || "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });
