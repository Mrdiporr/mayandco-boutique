import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CreditCard, Loader2, Lock, ShieldAlert } from "lucide-react";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart, type CartLine } from "@/context/cart";
import { naira } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — MAY & CO." },
      {
        name: "description",
        content:
          "Complete your MAY & CO. order with card or instant bank transfer. Strictly pre-paid — no payment on delivery.",
      },
      { property: "og:title", content: "Secure Checkout — MAY & CO." },
      {
        property: "og:description",
        content: "Card or instant bank transfer. Strictly pre-paid, no payment on delivery.",
      },
    ],
  }),
  component: CheckoutPage,
});

const SHIPPING_FEE = 5000;

type Method = "card" | "transfer";
type Stage = "form" | "method" | "processing" | "done";

type Details = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

const emptyDetails: Details = { name: "", email: "", phone: "", address: "", city: "", state: "" };

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [stage, setStage] = useState<Stage>("form");
  const [method, setMethod] = useState<Method>("card");
  const [seconds, setSeconds] = useState(10);
  const [order, setOrder] = useState<{ ref: string; lines: CartLine[]; total: number } | null>(
    null,
  );

  const total = subtotal + (lines.length ? SHIPPING_FEE : 0);
  const hasPreOrder = useMemo(() => lines.some((l) => l.preOrder), [lines]);

  useEffect(() => {
    if (stage !== "processing") return;
    setSeconds(method === "transfer" ? 10 : 3);
    const started = Date.now();
    const duration = method === "transfer" ? 10000 : 3000;
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((duration - (Date.now() - started)) / 1000));
      setSeconds(left);
    }, 250);
    const done = window.setTimeout(() => {
      setOrder({
        ref: `MC-${Date.now().toString().slice(-8)}`,
        lines,
        total,
      });
      setStage("done");
      clear();
    }, duration);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [stage, method, lines, total, clear]);

  const validate = () => {
    const next: Partial<Record<keyof Details, string>> = {};
    if (!details.name.trim()) next.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(details.email)) next.email = "Enter a valid email";
    if (details.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (!details.address.trim()) next.address = "Required";
    if (!details.city.trim()) next.city = "Required";
    if (!details.state.trim()) next.state = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const downloadReceipt = () => {
    if (!order) return;
    const body = [
      "MAY & CO. — ORDER RECEIPT",
      "=================================",
      `Order reference: ${order.ref}`,
      `Date: ${new Date().toLocaleString("en-NG")}`,
      `Customer: ${details.name}`,
      `Email: ${details.email}`,
      `Phone: ${details.phone}`,
      `Deliver to: ${details.address}, ${details.city}, ${details.state}`,
      `Payment method: ${method === "card" ? "Card Payment" : "Instant Bank Transfer"}`,
      "",
      "ITEMS",
      ...order.lines.map(
        (l) =>
          `${l.quantity} x ${l.name} (Size ${l.size})${l.preOrder ? " [PRE-ORDER 2-3 WEEKS]" : ""} — ${naira(l.price * l.quantity)}`,
      ),
      "",
      `Shipping: ${naira(SHIPPING_FEE)}`,
      `TOTAL PAID: ${naira(order.total)}`,
      "",
      "Status: PAID IN FULL. No payment on delivery is required or accepted.",
      "",
      "Mayandco.ng is an independent retailer. Brand names, logos, and trademarks",
      "displayed remain the sole property of their respective owners and are utilized",
      "strictly for product descriptive purposes.",
    ].join("\n");

    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mayandco-receipt-${order.ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (stage === "done" && order) {
    return (
      <Layout>
        <div className="fade-up mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
          <h1 className="mt-6 font-display text-4xl">Order Confirmed & Paid</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Reference {order.ref} · Paid via{" "}
            {method === "card" ? "card" : "instant bank transfer"}
          </p>

          <div className="mt-10 border border-border bg-card p-6 text-left">
            <p className="eyebrow text-muted-foreground">Breakdown</p>
            <ul className="mt-4 space-y-3">
              {order.lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-4 text-sm">
                  <span>
                    {l.quantity} × {l.name}{" "}
                    <span className="text-muted-foreground">(Size {l.size})</span>
                    {l.preOrder && (
                      <span className="block text-xs text-accent-foreground/80">
                        Pre-order — fulfills in 2–3 weeks
                      </span>
                    )}
                  </span>
                  <span>{naira(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{naira(SHIPPING_FEE)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total paid</span>
                <span>{naira(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={downloadReceipt} className="rounded-none px-8 py-6">
              Download receipt
            </Button>
            <Button asChild variant="outline" className="rounded-none px-8 py-6">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-3xl">Your bag is empty.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Explore our new arrivals to start an order.
          </p>
          <Button asChild className="mt-8 rounded-none px-8 py-6">
            <Link to="/new-arrivals">Shop new arrivals</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const field = (key: keyof Details, label: string, type = "text", full = false) => (
    <div className={cn(full && "sm:col-span-2")}>
      <Label htmlFor={key} className="eyebrow text-muted-foreground">
        {label}
      </Label>
      <Input
        id={key}
        type={type}
        value={details[key]}
        onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
        className="mt-2 rounded-none border-border bg-card"
      />
      {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-start gap-3 border border-accent bg-accent/10 p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
              <p className="text-xs leading-relaxed">
                <span className="font-medium">Strictly no payment on delivery.</span> Orders are
                dispatched only after payment is confirmed by card or instant bank transfer.
              </p>
            </div>

            <h2 className="mt-10 font-display text-2xl">Delivery details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {field("name", "Full name", "text", true)}
              {field("email", "Email", "email")}
              {field("phone", "Phone", "tel")}
              {field("address", "Delivery address", "text", true)}
              {field("city", "City")}
              {field("state", "State")}
            </div>

            <Button
              className="mt-8 w-full rounded-none py-7 sm:w-auto sm:px-12"
              onClick={() => {
                if (validate()) setStage("method");
              }}
            >
              <Lock className="mr-2 h-4 w-4" /> Continue to payment
            </Button>
          </div>

          <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="eyebrow text-muted-foreground">Order summary</p>
            <ul className="mt-5 space-y-4">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-4 text-sm">
                  <span>
                    {l.quantity} × {l.name}
                    <span className="block text-xs text-muted-foreground">Size {l.size}</span>
                    {l.preOrder && (
                      <span className="block text-xs text-accent-foreground/80">
                        Pre-order — 2–3 weeks
                      </span>
                    )}
                  </span>
                  <span>{naira(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{naira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{naira(SHIPPING_FEE)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-medium">
                <span>Total</span>
                <span>{naira(total)}</span>
              </div>
            </div>
            {hasPreOrder && (
              <p className="mt-4 text-xs text-muted-foreground">
                This order contains pre-order pieces fulfilling in 2–3 weeks. In-stock pieces ship
                first at no extra cost.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Payment processing modal */}
      <Dialog
        open={stage === "method" || stage === "processing"}
        onOpenChange={(open) => {
          if (!open && stage !== "processing") setStage("form");
        }}
      >
        <DialogContent
          showCloseButton={stage !== "processing"}
          className="rounded-none border-border p-0 sm:max-w-md"
        >
          <div className="border-b border-border px-6 py-4">
            <p className="eyebrow text-muted-foreground">Secure payment</p>
            <p className="mt-1 text-sm font-medium">{naira(total)} · MAY & CO.</p>
          </div>

          {stage === "method" ? (
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground">
                Choose how you'd like to pay. Payment on delivery is not available.
              </p>
              <div className="mt-4 space-y-3">
                {(
                  [
                    { id: "card", label: "Card Payment", copy: "Visa, Mastercard, Verve", icon: CreditCard },
                    {
                      id: "transfer",
                      label: "Instant Bank Transfer",
                      copy: "Auto-verified in seconds",
                      icon: Building2,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMethod(opt.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border p-4 text-left transition-colors",
                      method === opt.id
                        ? "border-foreground bg-muted"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    <span>
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.copy}</span>
                    </span>
                  </button>
                ))}
              </div>

              {method === "transfer" && (
                <div className="mt-4 border border-border bg-muted/50 p-4 text-xs">
                  <p className="eyebrow text-muted-foreground">Transfer to</p>
                  <p className="mt-2">MAY &amp; CO. RETAIL LTD</p>
                  <p className="text-muted-foreground">Providus Bank · 9901234567</p>
                  <p className="mt-2 text-muted-foreground">
                    We verify your transfer automatically — do not close this window.
                  </p>
                </div>
              )}

              <Button
                className="mt-5 w-full rounded-none py-6"
                onClick={() => setStage("processing")}
              >
                {method === "card" ? "Pay with card" : "Pay via Bank Transfer"}
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Payments processed securely. Simulated gateway for demonstration.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 pb-10 pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="mt-5 font-display text-xl">
                {method === "transfer" ? "Verifying your transfer" : "Authorising your card"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Matching payment reference · {seconds}s remaining
              </p>
              <div className="mt-5 h-px w-full bg-border">
                <div
                  className="h-px bg-accent transition-all duration-300"
                  style={{
                    width: `${100 - (seconds / (method === "transfer" ? 10 : 3)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
