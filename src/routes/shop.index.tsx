import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Layout, PageHeader } from "@/components/store/Layout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { PRODUCTS, SIZES, totalStock, type Size } from "@/lib/products";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.enum(["all", "clothing", "accessories"]).catch("all"),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop All — MAY & CO. Curated Female Apparel" },
      {
        name: "description",
        content:
          "Browse the full MAY & CO. catalogue of luxury street clothing and curated accessories. Filter by category, size and availability.",
      },
      { property: "og:title", content: "Shop All — MAY & CO." },
      {
        property: "og:description",
        content: "The full catalogue of luxury street clothing and curated accessories.",
      },
    ],
  }),
  component: ShopPage,
});

type Availability = "all" | "in-stock" | "pre-order";

function ShopPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [size, setSize] = useState<Size | "all">("all");
  const [availability, setAvailability] = useState<Availability>("all");

  const products = PRODUCTS.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (size !== "all" && p.stock[size] === 0 && totalStock(p) > 0) return false;
    if (availability === "in-stock" && totalStock(p) === 0) return false;
    if (availability === "pre-order" && totalStock(p) > 0) return false;
    return true;
  });

  const pill = (active: boolean) =>
    cn(
      "eyebrow border px-3 py-2 transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
    );

  return (
    <Layout>
      <PageHeader
        eyebrow="Catalogue"
        title="Shop All"
        description="Every piece in the current MAY & CO. rotation — clothing and curated accessories."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="space-y-4 border-y border-border py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2 text-muted-foreground">Category</span>
            {(["all", "clothing", "accessories"] as const).map((c) => (
              <button
                key={c}
                className={pill(category === c)}
                onClick={() => navigate({ search: { category: c } })}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2 text-muted-foreground">Size</span>
            <button className={pill(size === "all")} onClick={() => setSize("all")}>
              All
            </button>
            {SIZES.map((s) => (
              <button key={s} className={pill(size === s)} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2 text-muted-foreground">Availability</span>
            {(["all", "in-stock", "pre-order"] as const).map((a) => (
              <button
                key={a}
                className={pill(availability === a)}
                onClick={() => setAvailability(a)}
              >
                {a.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">{products.length} pieces</p>
        <div className="mt-6 pb-10">
          <ProductGrid
            products={products}
            emptyMessage="Try clearing a filter — or explore the Pre-Order Hub for restocked silhouettes."
          />
        </div>
      </div>
    </Layout>
  );
}
