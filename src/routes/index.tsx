import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Layout } from "@/components/store/Layout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { storefrontQuery } from "@/lib/store-queries";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "MAY & CO. — Curated Female Apparel | Luxury Street Fashion Nigeria" },
      {
        name: "description",
        content:
          "Luxury street fashion and contemporary female apparel, curated in Nigeria. Shop new drops, pre-order exclusives and secure bank transfer or WhatsApp checkout.",
      },
      { property: "og:title", content: "MAY & CO. — Curated Female Apparel" },
      {
        property: "og:description",
        content:
          "Luxury street fashion and contemporary female apparel, curated in Nigeria. Explore the new drops.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const featured = data.products.slice(0, 4);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt="MAY & CO. editorial campaign — model in cream tailored streetwear"
            width={1920}
            height={1280}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="fade-up mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
              <p className="eyebrow text-background/80">Autumn Edit — Lagos</p>
              <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.02] text-background sm:text-6xl lg:text-7xl">
                MAY &amp; CO. — CURATED FEMALE APPAREL.
              </h1>
              <p className="mt-5 max-w-md text-sm text-background/80">
                Sculpted silhouettes, sourced rarities and a strictly pre-paid, next-day dispatch
                promise.
              </p>
              <Button
                asChild
                className="mt-8 rounded-none bg-background px-10 py-6 text-foreground hover:bg-background/90"
              >
                <Link to="/new-arrivals">Explore New Drops</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-y border-border bg-foreground py-3">
        <p className="eyebrow text-center text-background">
          Next day dispatch in Lagos · Nationwide delivery · Strictly no payment on delivery
        </p>
      </div>

      {/* Featured grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">The Edit</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">Signature pieces</h2>
          </div>
          <Link to="/shop" className="eyebrow hidden border-b border-foreground pb-1 md:block">
            Shop all
          </Link>
        </div>
        <div className="mt-10">
          <ProductGrid products={featured} />
        </div>
        <Link
          to="/shop"
          className="eyebrow mt-10 inline-block border-b border-foreground pb-1 md:hidden"
        >
          Shop all
        </Link>
      </section>

      {/* Editorial split */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-10">
          <div>
            <p className="eyebrow text-muted-foreground">Pre-Order Hub</p>
            <h2 className="mt-3 font-display text-3xl leading-tight md:text-5xl">
              Sold out is never the end of the story.
            </h2>
            <p className="mt-5 max-w-md text-sm text-muted-foreground">
              When a size runs dry, the piece switches to pre-order automatically. Reserve yours
              and we fulfill within 2–3 weeks — tracked from atelier to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant="outline" className="rounded-none border-accent px-8 py-6">
                <Link to="/pre-order">Browse the Pre-Order Hub</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-none px-8 py-6">
                <Link to="/catalogue">Personal Shopper Catalogue →</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.products.slice(4, 6).map((p) => (
              <img
                key={p.slug}
                src={p.image}
                alt={p.name}
                loading="lazy"
                width={1024}
                height={1365}
                className="aspect-[3/4] w-full object-cover"
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
