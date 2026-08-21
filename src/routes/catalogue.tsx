import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Send, X } from "lucide-react";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { catalogueQuery, storefrontQuery } from "@/lib/store-queries";
import { submitShopperRequest } from "@/lib/store.functions";
import { openWhatsApp } from "@/lib/whatsapp";
import type { CatalogueItem } from "@/lib/products";

export const Route = createFileRoute("/catalogue")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(catalogueQuery),
      context.queryClient.ensureQueryData(storefrontQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Personal Shopper Catalogue — MAY & CO. Request Any Piece" },
      {
        name: "description",
        content:
          "Browse the MAY & CO. personal shopper catalogue: apparel, caps, hair accessories, gift boxes and China pre-order sourcing. Select pieces and send your request on WhatsApp.",
      },
      { property: "og:title", content: "Personal Shopper Catalogue — MAY & CO." },
      {
        property: "og:description",
        content:
          "A 3D gallery of everything we can source for you — select pieces, add sizes and budget, and send the request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CataloguePage,
});

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function CataloguePage() {
  const { data: pieces } = useSuspenseQuery(catalogueQuery);
  const { data: store } = useSuspenseQuery(storefrontQuery);
  const sceneRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<CatalogueItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  const toggle = useCallback((title: string) => {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -8, y: px * 12 });
    };
    const reset = () => setTilt({ x: 0, y: 0 });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [reducedMotion]);

  // Roving keyboard navigation across the gallery grid.
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const cards = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>("[data-gallery-card]") ?? [],
    );
    const index = cards.findIndex((c) => c === document.activeElement);
    if (index === -1) return;
    e.preventDefault();
    const columns = window.matchMedia("(min-width: 1024px)").matches
      ? 3
      : window.matchMedia("(min-width: 640px)").matches
        ? 2
        : 1;
    const next =
      e.key === "ArrowRight"
        ? index + 1
        : e.key === "ArrowLeft"
          ? index - 1
          : e.key === "ArrowDown"
            ? index + columns
            : e.key === "ArrowUp"
              ? index - columns
              : e.key === "Home"
                ? 0
                : cards.length - 1;
    cards[Math.max(0, Math.min(cards.length - 1, next))]?.focus();
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <p className="eyebrow text-background/60">Personal Shopper</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.03] md:text-6xl">
            The Request Catalogue.
          </h1>
          <p className="mt-5 max-w-xl text-sm text-background/70">
            Everything below is sourceable on request — apparel, headwear, hair, gifting and full
            China pre-order runs. Select the pieces you want, add your sizes and budget, and send
            the request straight to our shopper.
          </p>
          <a href="#request-form" className="eyebrow mt-6 inline-block border-b border-background/70 pb-1">
            Skip to the request form
          </a>
        </div>
      </section>

      {/* 3D gallery */}
      <section
        ref={sceneRef}
        className="relative bg-gradient-to-b from-muted/60 to-background px-4 py-20 sm:px-6 lg:px-10"
        style={{ perspective: reducedMotion ? undefined : "1400px" }}
        aria-label="Personal shopper gallery"
      >
        <p className="mx-auto mb-8 max-w-7xl text-xs text-muted-foreground">
          Use the arrow keys to move through the gallery, Enter to open a piece, and the Select
          button to add it to your request.
        </p>
        <div
          ref={gridRef}
          onKeyDown={onGridKeyDown}
          className="mx-auto grid max-w-7xl gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          style={
            reducedMotion
              ? undefined
              : {
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                }
          }
        >
          {pieces.map((piece, i) => {
            const isSelected = selected.includes(piece.title);
            return (
              <div
                key={piece.id}
                className="group relative"
                style={
                  reducedMotion
                    ? undefined
                    : {
                        transformStyle: "preserve-3d",
                        transform: `translateZ(${(i % 3) * 26 - 26}px)`,
                      }
                }
              >
                <button
                  data-gallery-card
                  onClick={() => setActive(piece)}
                  aria-haspopup="dialog"
                  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4"
                >
                  <div
                    className="relative overflow-hidden bg-muted shadow-[0_28px_60px_-30px_rgba(0,0,0,0.55)] transition-shadow duration-500 group-hover:shadow-[0_44px_90px_-32px_rgba(0,0,0,0.6)]"
                    style={reducedMotion ? undefined : { transformStyle: "preserve-3d" }}
                  >
                    <img
                      src={piece.image}
                      alt={piece.title}
                      loading="lazy"
                      className={cn(
                        "aspect-[4/5] w-full object-cover",
                        !reducedMotion &&
                          "transition-transform duration-700 group-hover:scale-[1.06]",
                      )}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-80" />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 p-5"
                      style={reducedMotion ? undefined : { transform: "translateZ(48px)" }}
                    >
                      <p className="eyebrow text-background/70">{piece.tag}</p>
                      <p className="mt-1 font-display text-2xl text-background">{piece.title}</p>
                    </div>
                    <span className="pointer-events-none absolute inset-0 border border-background/10" />
                  </div>
                </button>
                <p className="mt-4 text-sm text-muted-foreground">{piece.note}</p>
                <button
                  onClick={() => toggle(piece.title)}
                  aria-pressed={isSelected}
                  className={cn(
                    "eyebrow mt-3 inline-flex min-h-11 items-center gap-2 border px-4 py-2 transition-colors",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground",
                  )}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                  {isSelected ? "Selected" : "Select for request"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detail sheet */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
            aria-hidden="true"
          />
          <div className="relative m-4 w-full max-w-lg border border-border bg-background p-6 shadow-2xl">
            <button
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="eyebrow text-muted-foreground">{active.tag}</p>
            <h2 className="mt-2 font-display text-3xl">{active.title}</h2>
            <img
              src={active.image}
              alt={active.title}
              className="mt-5 max-h-[46vh] w-full object-contain"
            />
            <p className="mt-4 text-sm text-muted-foreground">{active.note}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className="rounded-none py-6 sm:flex-1"
                onClick={() => {
                  toggle(active.title);
                  setActive(null);
                  document.getElementById("request-form")?.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth",
                  });
                }}
              >
                {selected.includes(active.title) ? "Remove from request" : "Add to my request"}
              </Button>
              <Button
                variant="outline"
                className="rounded-none py-6 sm:flex-1"
                onClick={() => setActive(null)}
              >
                Keep browsing
              </Button>
            </div>
          </div>
        </div>
      )}

      <RequestForm
        selected={selected}
        onClear={() => setSelected([])}
        whatsapp={store.settings.whatsappNumber}
      />

      {/* In-stock cross sell */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-16 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted-foreground">Ready now</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Or shop what is already in the studio.
            </h2>
          </div>
          <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
            Shop all {store.products.length} pieces
          </Link>
        </div>
      </section>
    </Layout>
  );
}

function RequestForm({
  selected,
  onClear,
  whatsapp,
}: {
  selected: string[];
  onClear: () => void;
  whatsapp: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    sizes: "",
    budget: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please add your name");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 7) {
      toast.error("Add a valid phone number");
      return;
    }
    if (selected.length === 0 && !form.message.trim()) {
      toast.error("Select a piece or describe what you are looking for");
      return;
    }
    setSending(true);
    try {
      await submitShopperRequest({
        data: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          budget: form.budget.trim(),
          sizes: form.sizes.trim(),
          message: form.message.trim(),
          items: selected,
        },
      });
      setSent(true);
      const message = [
        "Personal shopper request — MAY & CO.",
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        selected.length ? `Pieces: ${selected.join(", ")}` : null,
        form.sizes ? `Sizes: ${form.sizes}` : null,
        form.budget ? `Budget: ${form.budget}` : null,
        form.message ? `Notes: ${form.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      openWhatsApp(whatsapp, message);
      toast.success("Request sent — continue on WhatsApp");
      onClear();
    } catch {
      toast.error("Could not send your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="request-form" className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-10">
        <div>
          <p className="eyebrow text-muted-foreground">Send a request</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Tell us what to source for you.
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Your request lands in our studio dashboard and opens WhatsApp so we can quote, confirm
            sizing and lock your slot on the next sourcing run.
          </p>
          <div className="mt-6">
            <p className="eyebrow text-muted-foreground">Selected pieces</p>
            {selected.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing selected yet — pick from the gallery above or describe it below.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {selected.map((s) => (
                  <li key={s} className="eyebrow border border-border bg-background px-3 py-2">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-5 border border-border bg-background p-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="req-name" className="eyebrow text-muted-foreground">
              Name
            </Label>
            <Input
              id="req-name"
              value={form.name}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-2 rounded-none"
            />
          </div>
          <div>
            <Label htmlFor="req-phone" className="eyebrow text-muted-foreground">
              WhatsApp phone
            </Label>
            <Input
              id="req-phone"
              type="tel"
              value={form.phone}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-2 rounded-none"
            />
          </div>
          <div>
            <Label htmlFor="req-sizes" className="eyebrow text-muted-foreground">
              Preferred sizes
            </Label>
            <Input
              id="req-sizes"
              placeholder="e.g. UK 12 / L"
              value={form.sizes}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
              className="mt-2 rounded-none"
            />
          </div>
          <div>
            <Label htmlFor="req-budget" className="eyebrow text-muted-foreground">
              Budget
            </Label>
            <Input
              id="req-budget"
              placeholder="e.g. ₦80,000 – ₦150,000"
              value={form.budget}
              maxLength={60}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              className="mt-2 rounded-none"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="req-message" className="eyebrow text-muted-foreground">
              What are you looking for?
            </Label>
            <Textarea
              id="req-message"
              rows={4}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="mt-2 rounded-none"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={sending} className="w-full rounded-none py-7">
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send request &amp; open WhatsApp
            </Button>
            {sent && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Request received. If WhatsApp did not open, check your pop-up blocker.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
