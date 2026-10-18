import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || !/^[A-Za-z0-9._-]{1,200}$/.test(path) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        // Only serve files the public storefront actually references, checked as anon (RLS applies).
        const url = `/api/public/media/${path}`;
        const { publicSupabase } = await import("@/lib/supabase-public.server");
        const pub = publicSupabase();
        const [p, c, pi] = await Promise.all([
          pub.from("products").select("id").eq("image", url).eq("active", true).limit(1),
          pub.from("catalogue_items").select("id").eq("image", url).eq("visible", true).limit(1),
          pub.from("product_images").select("id").eq("url", url).limit(1),
        ]);
        const referenced = [p, c, pi].some((r) => !r.error && (r.data?.length ?? 0) > 0);
        if (!referenced) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("store-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const bytes = new Uint8Array(await data.arrayBuffer());
        const signatureMatches =
          (data.type === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
          (data.type === "image/png" && bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) ||
          (data.type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") ||
          (data.type === "image/gif" && bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.subarray(0, 6))));

        if (!signatureMatches) return new Response("Not found", { status: 404 });

        return new Response(bytes, {
          headers: {
            "content-type": data.type,
            "x-content-type-options": "nosniff",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
