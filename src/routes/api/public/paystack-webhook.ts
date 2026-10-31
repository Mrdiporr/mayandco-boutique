import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isValidPaystackSignature } from "@/lib/paystack";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        // The secret may live in admin settings or in the project env.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: priv } = await supabaseAdmin
          .from("store_private_settings")
          .select("paystack_secret_key")
          .eq("id", true)
          .maybeSingle();
        const secret = priv?.paystack_secret_key?.trim() || process.env["PAYSTACK_SECRET_KEY"] || "";
        if (!secret) return new Response("Payments are not configured", { status: 503 });

        if (!(await isValidPaystackSignature(secret, rawBody, signature))) {
          return new Response("Invalid signature", { status: 401 });
        }

        const parsed = z
          .object({
            event: z.string().max(60),
            data: z.object({ reference: z.string().trim().min(4).max(100) }),
          })
          .safeParse(JSON.parse(rawBody));
        if (!parsed.success) return Response.json({ received: true });

        if (parsed.data.event === "charge.success") {
          // confirmPaystackPayment re-verifies with Paystack and matches the amount
          // against the server-computed order total before marking anything paid.
          const { confirmPaystackPayment } = await import("@/lib/paystack.server");
          const result = await confirmPaystackPayment(parsed.data.data.reference);
          if (!result) console.error("Paystack webhook: no order for", parsed.data.data.reference);
        }

        // Always 200 for verified events so Paystack stops retrying.
        return Response.json({ received: true });
      },
    },
  },
});
