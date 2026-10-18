import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { naira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TRACKING_STAGES } from "@/lib/paystack";
import { trackOrder } from "@/lib/store.functions";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ ref: z.string().max(40).optional() }),
  head: () => ({
    meta: [
      { title: "Track Your Order — MAY & CO." },
      {
        name: "description",
        content: "Check your MAY & CO. order status from received to delivered.",
      },
      { property: "og:title", content: "Track Your Order — MAY & CO." },
      {
        property: "og:description",
        content: "Enter your order reference and phone number to see live order status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

const LABELS: Record<string, string> = {
  received: "Received",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

type Result = Awaited<ReturnType<typeof trackOrder>>;

function TrackPage() {
  const { ref } = Route.useSearch();
  const [reference, setReference] = useState(ref ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await trackOrder({ data: { reference: reference.trim(), phone: phone.trim() } });
      setResult(r);
      if (!r.found) setError("We couldn't find an order with that reference and phone number.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const found = result && result.found ? result : null;
  const currentIndex = found && found.stage !== "cancelled" ? TRACKING_STAGES.indexOf(found.stage) : -1;
  const when = (stage: string) => found?.events.filter((e) => e.stage === stage).at(-1);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="eyebrow text-muted-foreground">Order status</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Track your order</h1>

        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="ref" className="eyebrow text-muted-foreground">Order reference</Label>
            <Input id="ref" value={reference} maxLength={40} placeholder="MC-XXXXXXX"
              onChange={(e) => setReference(e.target.value)} className="mt-2 rounded-none uppercase" required />
          </div>
          <div>
            <Label htmlFor="phone" className="eyebrow text-muted-foreground">Phone used at checkout</Label>
            <Input id="phone" type="tel" value={phone} maxLength={30}
              onChange={(e) => setPhone(e.target.value)} className="mt-2 rounded-none" required />
          </div>
          <Button type="submit" disabled={busy} className="rounded-none py-5">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Track
          </Button>
        </form>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {found && (
          <section className="mt-12 border border-border p-6">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-display text-2xl">{found.reference}</p>
              <p className="font-display text-2xl">{naira(found.total)}</p>
            </div>

            {found.stage === "cancelled" ? (
              <p className="mt-6 text-sm font-medium text-destructive">This order was cancelled.</p>
            ) : (
              <ol className="mt-8 space-y-6">
                {TRACKING_STAGES.map((stage, i) => {
                  const done = i <= currentIndex;
                  const ev = when(stage);
                  return (
                    <li key={stage} className="flex gap-4">
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        done ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground")}>
                        {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                      </span>
                      <div>
                        <p className={cn("font-medium", !done && "text-muted-foreground")}>{LABELS[stage]}</p>
                        {(ev || (stage === "received" && done)) && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(ev?.at ?? found.createdAt).toLocaleString()}
                          </p>
                        )}
                        {ev?.note && <p className="mt-1 text-sm text-muted-foreground">{ev.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {found.trackingNote && (
              <p className="mt-6 border-t border-border pt-4 text-sm">
                <span className="eyebrow text-muted-foreground">Delivery note · </span>
                {found.trackingNote}
              </p>
            )}

            <ul className="mt-6 space-y-1 border-t border-border pt-4 text-sm">
              {found.items.map((it, idx) => (
                <li key={idx}>
                  {it.name} · {it.size} × {it.quantity}
                  {it.pre_order && <span className="text-accent-foreground"> · Pre-order, fulfills in 2–3 weeks</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Layout>
  );
}
