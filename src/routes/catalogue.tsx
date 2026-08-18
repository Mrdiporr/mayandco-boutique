import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/store/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/products";
import leopardReal from "@/assets/leopard-real.asset.json";
import capsAsset from "@/assets/img-2319.asset.json";
import floralDressAsset from "@/assets/img-2318.asset.json";
import stripedSetAsset from "@/assets/img-2317.asset.json";
import clawClipsAsset from "@/assets/img-2313.asset.json";
import giftBoxAsset from "@/assets/img-2312.asset.json";
import priceListAsset from "@/assets/img-2309.asset.json";
import preorderFlyerAsset from "@/assets/img-2310.asset.json";
import sizeChartAsset from "@/assets/img-2311.asset.json";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Personal Shopper Catalogue — MAY & CO. Request Any Piece" },
      {
        name: "description",
        content:
          "Browse the MAY & CO. personal shopper catalogue: apparel, caps, hair accessories, gift boxes and China pre-order sourcing. Request any piece directly.",
      },
      { property: "og:title", content: "Personal Shopper Catalogue — MAY & CO." },
      {
        property: "og:description",
        content:
          "A 3D gallery of everything we can source for you — apparel, accessories and curated gift boxes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CataloguePage,
});

type Piece = {
  image: string;
  title: string;
  tag: string;
  note: string;
};

const PIECES: Piece[] = [
  {
    image: leopardReal.url,
    title: "Leopard Mesh Sets",
    tag: "Apparel",
    note: "Mesh co-ords, capri sets and second-skin knits. Sizes S–XXL.",
  },
  {
    image: floralDressAsset.url,
    title: "Printed Slip Dresses",
    tag: "Apparel",
    note: "Ruched midi and maxi slips in watercolour, floral and solid tones.",
  },
  {
    image: stripedSetAsset.url,
    title: "Resort Two-Pieces",
    tag: "Apparel",
    note: "Knit polos, pleated balloon trousers and matching sets.",
  },
  {
    image: capsAsset.url,
    title: "Designer-Curated Caps",
    tag: "Headwear",
    note: "Baker boy caps in black, cream, chocolate and camel.",
  },
  {
    image: clawClipsAsset.url,
    title: "Matte Claw Clips",
    tag: "Hair",
    note: "Oversized strong-hold clips — request any colourway.",
  },
  {
    image: giftBoxAsset.url,
    title: "Curated Gift Boxes",
    tag: "Gifting",
    note: "Scrunchies, pearls, studs and clips packed to your colour story.",
  },
  {
    image: priceListAsset.url,
    title: "Lash & Beauty Add-Ons",
    tag: "Beauty",
    note: "Partner price list — classic, hybrid and volume sets.",
  },
  {
    image: preorderFlyerAsset.url,
    title: "China Pre-Order Runs",
    tag: "Sourcing",
    note: "Bags, shoes, skincare and appliances on scheduled batch runs.",
  },
  {
    image: sizeChartAsset.url,
    title: "Fit & Size Guide",
    tag: "Reference",
    note: "Bust, waist and hip in inches — sizes 6 through 24.",
  },
];

function CataloguePage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<Piece | null>(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
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
  }, []);

  const requestHref = (title: string) =>
    `https://instagram.com/mayandco.ng`.concat(
      `?utm_source=catalogue&utm_content=${encodeURIComponent(title)}`,
    );

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
            China pre-order runs. Move your cursor through the gallery, tap a piece, and send us the
            request.
          </p>
        </div>
      </section>

      {/* 3D gallery */}
      <section
        ref={sceneRef}
        className="relative bg-gradient-to-b from-muted/60 to-background px-4 py-20 sm:px-6 lg:px-10"
        style={{ perspective: "1400px" }}
      >
        <div
          className="mx-auto grid max-w-7xl gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {PIECES.map((piece, i) => (
            <button
              key={piece.title}
              onClick={() => setActive(piece)}
              className="group relative text-left"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateZ(${(i % 3) * 26 - 26}px)`,
              }}
            >
              <div
                className="relative overflow-hidden bg-muted shadow-[0_28px_60px_-30px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:shadow-[0_44px_90px_-32px_rgba(0,0,0,0.6)]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <img
                  src={piece.image}
                  alt={piece.title}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-80" />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 p-5"
                  style={{ transform: "translateZ(48px)" }}
                >
                  <p className="eyebrow text-background/70">{piece.tag}</p>
                  <p className="mt-1 font-display text-2xl text-background">{piece.title}</p>
                </div>
                <span className="pointer-events-none absolute inset-0 border border-background/10" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{piece.note}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Detail sheet */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 sm:items-center",
          active ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
          onClick={() => setActive(null)}
          aria-hidden="true"
        />
        {active && (
          <div className="relative m-4 w-full max-w-lg border border-border bg-background p-6 shadow-2xl">
            <p className="eyebrow text-muted-foreground">{active.tag}</p>
            <h2 className="mt-2 font-display text-3xl">{active.title}</h2>
            <img
              src={active.image}
              alt={active.title}
              className="mt-5 max-h-[46vh] w-full object-contain"
            />
            <p className="mt-4 text-sm text-muted-foreground">{active.note}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-none py-6 sm:flex-1">
                <a href={requestHref(active.title)} target="_blank" rel="noreferrer noopener">
                  Request this on Instagram
                </a>
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
        )}
      </div>

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
            Shop all {PRODUCTS.length} pieces
          </Link>
        </div>
      </section>
    </Layout>
  );
}
