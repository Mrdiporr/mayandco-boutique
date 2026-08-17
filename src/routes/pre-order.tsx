import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/store/Layout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { PRODUCTS, SIZES, totalStock } from "@/lib/products";

export const Route = createFileRoute("/pre-order")({
  head: () => ({
    meta: [
      { title: "Pre-Order Hub — MAY & CO. Reserve Sold-Out Pieces" },
      {
        name: "description",
        content:
          "Reserve sold-out MAY & CO. silhouettes. Pre-orders are fulfilled within 2–3 weeks and paid upfront — no payment on delivery.",
      },
      { property: "og:title", content: "Pre-Order Hub — MAY & CO." },
      {
        property: "og:description",
        content: "Reserve sold-out silhouettes. Fulfilled within 2–3 weeks.",
      },
    ],
  }),
  component: PreOrderHub,
});

function PreOrderHub() {
  const fullyPreOrder = PRODUCTS.filter((p) => totalStock(p) === 0);
  const partial = PRODUCTS.filter(
    (p) => totalStock(p) > 0 && SIZES.some((s) => p.stock[s] === 0),
  );

  return (
    <Layout>
      <PageHeader
        eyebrow="Reserve now"
        title="Pre-Order Hub"
        description="When stock hits zero the piece stays orderable. Reserve, pay upfront, and we fulfill within 2–3 weeks."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 border-y border-border py-8 sm:grid-cols-3">
          {[
            { step: "01", title: "Reserve", copy: "Choose your size and pay in full to lock the slot." },
            { step: "02", title: "Production", copy: "Your piece is cut, sourced or restocked within 2–3 weeks." },
            { step: "03", title: "Dispatch", copy: "We ship with tracking the moment it clears QC." },
          ].map((item) => (
            <div key={item.step}>
              <p className="eyebrow text-accent-foreground/70">{item.step}</p>
              <p className="mt-2 font-display text-xl">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>

        <section className="py-12">
          <h2 className="font-display text-2xl md:text-3xl">Available to pre-order</h2>
          <div className="mt-8">
            <ProductGrid
              products={fullyPreOrder}
              emptyMessage="Everything is in stock right now — shop the full catalogue."
            />
          </div>
        </section>

        {partial.length > 0 && (
          <section className="border-t border-border py-12">
            <h2 className="font-display text-2xl md:text-3xl">Selected sizes on pre-order</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These pieces are in stock in some sizes and pre-order in others.
            </p>
            <div className="mt-8">
              <ProductGrid products={partial} />
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
