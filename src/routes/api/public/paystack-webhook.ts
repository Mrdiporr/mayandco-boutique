import { createFileRoute } from "@tanstack/react-router";
import { isValidPaystackSignature } from "@/lib/paystack";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYSTACK_SECRET_KEY"] ?? "";
        const raw = await request.text();
        const ok = await isValidPaystackSignature(
          secret,
          raw,
          request.headers.get("x-paystack-signature"),
        );
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let event: { event?: string; data?: { reference?: unknown } };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const reference = event.data?.reference;
        if (event.event === "charge.success" && typeof reference === "string" && reference.length <= 80) {
          const { confirmPaystackPayment } = await import("@/lib/paystack.server");
          // Re-verifies with Paystack and checks the amount before marking paid (idempotent).
          await confirmPaystackPayment(reference);
        }
        return new Response("ok");
      },
    },
  },
});
