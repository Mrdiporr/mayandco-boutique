import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { naira } from "@/lib/format";
import { verifyCardPayment } from "@/lib/store.functions";

export const Route = createFileRoute("/checkout/callback")({
  validateSearch: z.object({ session_id: z.string().max(255).optional() }),
  head: () => ({
    meta: [
      { title: "Payment Confirmation — MAY & CO." },
      { name: "description", content: "Confirming your MAY & CO. payment." },
      { property: "og:title", content: "Payment Confirmation — MAY & CO." },
      { property: "og:description", content: "Confirming your MAY & CO. payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

type State =
  | { kind: "loading" }
  | { kind: "paid"; reference: string; total: number }
  | { kind: "failed"; reference?: string | undefined };

function CallbackPage() {
  const { session_id: sessionId } = Route.useSearch();
  const { clear } = useCart();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!sessionId) return setState({ kind: "failed" });
    let tries = 0;
    let cancelled = false;
    const run = async () => {
      try {
        const r = await verifyCardPayment({ data: { sessionId } });
        if (cancelled) return;
        if (r.found && r.paid) {
          clear();
          return setState({ kind: "paid", reference: r.reference, total: r.total });
        }
        if (++tries < 4) return void setTimeout(run, 2500);
        setState({ kind: "failed", reference: r.found ? r.reference : undefined });
      } catch {
        if (!cancelled) setState({ kind: "failed" });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        {state.kind === "loading" && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Confirming your payment…
          </div>
        )}
        {state.kind === "paid" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-accent-foreground" />
            <h1 className="mt-6 font-display text-4xl">Order confirmed &amp; paid</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Reference <span className="font-medium text-foreground">{state.reference}</span> ·{" "}
              {naira(state.total)}. No further action is needed — we'll prepare your order.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-none py-6 sm:flex-1">
                <Link to="/track" search={{ ref: state.reference }}>
                  Track your order
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-none py-6 sm:flex-1">
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </>
        )}
        {state.kind === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="mt-6 font-display text-4xl">Payment not confirmed</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We couldn't confirm this payment yet. If you were charged, it will update
              automatically within a few minutes — check{" "}
              <Link to="/track" search={{ ref: state.reference }} className="underline">
                order tracking
              </Link>
              .
            </p>
            <Button asChild className="mt-8 rounded-none py-6">
              <Link to="/checkout">Back to checkout</Link>
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
