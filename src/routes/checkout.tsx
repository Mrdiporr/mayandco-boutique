import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, Loader2, MessageCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart, type CartLine } from "@/context/cart";
import { naira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { storefrontQuery } from "@/lib/store-queries";
import { placeOrder } from "@/lib/store.functions";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/checkout")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Secure Checkout — MAY & CO." },
      {
        name: "description",
        content:
          "Complete your MAY & CO. order by bank transfer or WhatsApp. Strictly pre-paid — no payment on delivery.",
      },
      { property: "og:title", content: "Secure Checkout — MAY & CO." },
      {
        property: "og:description",
        content: "Bank transfer or WhatsApp checkout. Strictly pre-paid, no payment on delivery.",
      },
    ],
  }),
  component: CheckoutPage,
});

type Channel = "transfer" | "whatsapp";

type Details = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

const emptyDetails: Details = { name: "", email: "", phone: "", address: "", city: "", state: "" };

type Confirmed = {
  reference: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  channel: Channel;
};

function CheckoutPage() {
  const { data: store } = useSuspenseQuery(storefrontQuery);
  const settings = store.settings;
  const { lines, subtotal, clear } = useCart();
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [channel, setChannel] = useState<Channel>("transfer");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  const shipping = lines.length ? settings.shippingFee : 0;
  const total = subtotal + shipping;
  const hasPreOrder = useMemo(() => lines.some((l) => l.preOrder), [lines]);

  const set = (key: keyof Details, value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof Details, string>> = {};
    if (!details.name.trim()) next.name = "Enter your full name";
    if (details.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email))
      next.email = "Enter a valid email";
    if (details.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number";
    if (!details.address.trim()) next.address = "Enter your delivery address";
    if (!details.city.trim()) next.city = "Enter your city";
    if (!details.state.trim()) next.state = "Enter your state";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const orderMessage = (reference: string, orderTotal: number) =>
    [
      `MAY & CO. order ${reference}`,
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      `Deliver to: ${details.address}, ${details.city}, ${details.state}`,
      "",
      ...lines.map(
        (l) =>
          `• ${l.name} — size ${l.size} × ${l.quantity} — ${naira(l.price * l.quantity)}${
            l.preOrder ? " (pre-order)" : ""
          }`,
      ),
      "",
      `Subtotal: ${naira(subtotal)}`,
      `Shipping: ${naira(shipping)}`,
      `Total: ${naira(orderTotal)}`,
      "",
      channel === "transfer"
        ? "I am paying by bank transfer and will send proof of payment here."
        : "Please continue my order on WhatsApp.",
    ].join("\n");

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          customer: {
            name: details.name.trim(),
            email: details.email.trim(),
            phone: details.phone.trim(),
            address: details.address.trim(),
            city: details.city.trim(),
            state: details.state.trim(),
          },
          channel,
          items: lines.map((l) => ({
            slug: l.slug,
            size: l.size,
            quantity: l.quantity,
            preOrder: l.preOrder,
          })),
        },
      });
      const snapshot: Confirmed = {
        reference: result.reference,
        lines,
        subtotal: result.subtotal,
        shipping: result.shipping,
        total: result.total,
        channel,
      };
      setConfirmed(snapshot);
      openWhatsApp(settings.whatsappNumber, orderMessage(result.reference, result.total));
      clear();
      toast.success(`Order ${result.reference} sent to the studio`);
    } catch {
      toast.error("We could not submit your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <Layout>
        <OrderConfirmation order={confirmed} settings={settings} details={details} />
      </Layout>
    );
  }

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
          <h1 className="font-display text-4xl">Your bag is empty.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Explore our new arrivals and start your order.
          </p>
          <Button asChild className="mt-8 rounded-none px-10 py-6">
            <Link to="/new-arrivals">Explore New Drops</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
        <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>

        <div className="mt-6 flex items-start gap-3 border border-accent/50 bg-accent/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Strictly no payment on delivery.
            </span>{" "}
            Orders are confirmed only after payment is received. Your details go straight to our
            studio, and we finish the order with you on WhatsApp.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <section>
              <h2 className="eyebrow text-muted-foreground">Delivery details</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" id="name" value={details.name} error={errors.name} onChange={(v) => set("name", v)} />
                <Field label="Phone (WhatsApp)" id="phone" type="tel" value={details.phone} error={errors.phone} onChange={(v) => set("phone", v)} />
                <Field label="Email (optional)" id="email" type="email" value={details.email} error={errors.email} onChange={(v) => set("email", v)} />
                <Field label="City" id="city" value={details.city} error={errors.city} onChange={(v) => set("city", v)} />
                <Field label="State" id="state" value={details.state} error={errors.state} onChange={(v) => set("state", v)} />
                <div className="sm:col-span-2">
                  <Field label="Delivery address" id="address" value={details.address} error={errors.address} onChange={(v) => set("address", v)} />
                </div>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="eyebrow text-muted-foreground">How would you like to finish?</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ChannelCard
                  active={channel === "transfer"}
                  onClick={() => setChannel("transfer")}
                  icon={<Building2 className="h-5 w-5" />}
                  title="Bank transfer"
                  copy="Get our account details now, transfer, then send proof on WhatsApp."
                />
                <ChannelCard
                  active={channel === "whatsapp"}
                  onClick={() => setChannel("whatsapp")}
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Continue on WhatsApp"
                  copy="We send your full order to the studio and a stylist takes it from there."
                />
              </div>

              {channel === "transfer" && (
                <div className="mt-6 border border-border bg-muted/40 p-5">
                  <p className="eyebrow text-muted-foreground">Payment instructions</p>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <Row label="Bank" value={settings.bankName || "Shared on WhatsApp"} />
                    <Row label="Account name" value={settings.accountName || "Shared on WhatsApp"} />
                    <Row
                      label="Account number"
                      value={settings.accountNumber || "Shared on WhatsApp"}
                    />
                    <Row label="Amount" value={naira(total)} />
                  </dl>
                  {settings.transferInstructions && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {settings.transferInstructions}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={submit}
                disabled={submitting}
                className="mt-8 w-full rounded-none py-7 text-sm tracking-[0.18em] uppercase"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {channel === "transfer"
                  ? `Confirm order & send proof on WhatsApp`
                  : `Send my order to WhatsApp`}
              </Button>
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit border border-border p-6 lg:sticky lg:top-28">
            <h2 className="eyebrow text-muted-foreground">Order summary</h2>
            <ul className="mt-5 space-y-4">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-4">
                  <img src={l.image} alt={l.name} className="h-20 w-16 object-cover" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-muted-foreground">
                      Size {l.size} · Qty {l.quantity}
                    </p>
                    {l.preOrder && (
                      <p className="eyebrow mt-1 text-accent-foreground">
                        Pre-order · 2–3 weeks
                      </p>
                    )}
                  </div>
                  <p className="text-sm">{naira(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={naira(subtotal)} />
              <Row label="Shipping" value={naira(shipping)} />
              <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
                <dt>Total</dt>
                <dd>{naira(total)}</dd>
              </div>
            </dl>
            {hasPreOrder && (
              <p className="mt-4 text-xs text-muted-foreground">
                This order contains pre-order pieces fulfilled in 2–3 weeks.
              </p>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={300}
        onChange={(e) => onChange(e.target.value)}
        className={cn("mt-2 rounded-none", error && "border-destructive")}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ChannelCard({
  active,
  onClick,
  icon,
  title,
  copy,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "border p-5 text-left transition-colors",
        active ? "border-foreground bg-foreground/[0.03]" : "border-border hover:border-foreground",
      )}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-display text-xl">{title}</span>
      </span>
      <span className="mt-2 block text-sm text-muted-foreground">{copy}</span>
    </button>
  );
}

function OrderConfirmation({
  order,
  settings,
  details,
}: {
  order: Confirmed;
  settings: { bankName: string; accountName: string; accountNumber: string; whatsappNumber: string };
  details: Details;
}) {
  const downloadReceipt = () => {
    const body = [
      "MAY & CO. — ORDER SUMMARY",
      `Reference: ${order.reference}`,
      `Date: ${new Date().toLocaleString()}`,
      `Customer: ${details.name} · ${details.phone}`,
      `Deliver to: ${details.address}, ${details.city}, ${details.state}`,
      "",
      ...order.lines.map(
        (l) =>
          `${l.name} | size ${l.size} | x${l.quantity} | ${naira(l.price * l.quantity)}${
            l.preOrder ? " | PRE-ORDER" : ""
          }`,
      ),
      "",
      `Subtotal: ${naira(order.subtotal)}`,
      `Shipping: ${naira(order.shipping)}`,
      `Total: ${naira(order.total)}`,
      "",
      order.channel === "transfer"
        ? `Pay by transfer to ${settings.bankName} · ${settings.accountName} · ${settings.accountNumber}`
        : "A stylist will confirm your order on WhatsApp.",
      "Strictly no payment on delivery.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mayandco-${order.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <CheckCircle2 className="h-12 w-12 text-accent-foreground" />
      <h1 className="mt-6 font-display text-4xl">Order received</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Reference <span className="font-medium text-foreground">{order.reference}</span>. Your
        order is in our studio dashboard.{" "}
        {order.channel === "transfer"
          ? "Complete your transfer and send proof on WhatsApp to confirm."
          : "A stylist will continue with you on WhatsApp."}
      </p>

      {order.channel === "transfer" && (
        <div className="mt-8 border border-border bg-muted/40 p-5 text-sm">
          <p className="eyebrow text-muted-foreground">Transfer to</p>
          <p className="mt-3">{settings.bankName || "Bank details shared on WhatsApp"}</p>
          <p>{settings.accountName}</p>
          <p className="font-display text-2xl">{settings.accountNumber}</p>
          <p className="mt-3">Amount: {naira(order.total)}</p>
        </div>
      )}

      <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
        {order.lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-4">
            <span>
              {l.name} · {l.size} × {l.quantity}
              {l.preOrder ? " · pre-order" : ""}
            </span>
            <span>{naira(l.price * l.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-border pt-3 font-display text-xl">
          <span>Total</span>
          <span>{naira(order.total)}</span>
        </li>
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          className="rounded-none py-6 sm:flex-1"
          onClick={() =>
            openWhatsApp(
              settings.whatsappNumber,
              `Hello MAY & CO., this is about order ${order.reference}.`,
            )
          }
        >
          Open WhatsApp
        </Button>
        <Button variant="outline" className="rounded-none py-6 sm:flex-1" onClick={downloadReceipt}>
          Download breakdown
        </Button>
      </div>
      <Link to="/shop" className="eyebrow mt-8 inline-block border-b border-foreground pb-1">
        Continue shopping
      </Link>
    </div>
  );
}
