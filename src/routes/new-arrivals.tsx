import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/store/Layout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { PRODUCTS } from "@/lib/products";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — MAY & CO. Latest Drops" },
      {
        name: "description",
        content:
          "The newest MAY & CO. drops: mesh sets, puff-sleeve dresses and sculpted separates, dispatched next day across Lagos.",
      },
      { property: "og:title", content: "New Arrivals — MAY & CO." },
      {
        property: "og:description",
        content: "The newest MAY & CO. drops, dispatched next day across Lagos.",
      },
    ],
  }),
  component: NewArrivals,
});

function NewArrivals() {
  const products = PRODUCTS.filter((p) => p.isNew);

  return (
    <Layout>
      <PageHeader
        eyebrow="Just landed"
        title="New Arrivals"
        description="Fresh from the atelier and the sourcing floor. Limited runs — once a size is gone, it moves to pre-order."
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-10">
        <ProductGrid products={products} emptyMessage="The next drop lands soon." />
      </div>
    </Layout>
  );
}
