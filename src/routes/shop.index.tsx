import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { z } from "zod";
import { Layout, PageHeader } from "@/components/store/Layout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SIZES, totalStock, type Size } from "@/lib/products";
import { storefrontQuery } from "@/lib/store-queries";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.enum(["all", "clothing", "accessories"]).catch("all"),
  q: z.string().optional().catch(undefined),
  sort: z.enum(["featured", "price-asc", "price-desc"]).optional().catch(undefined),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
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
  const { category, q = "", sort = "featured" } = Route.useSearch();
  const [query, setQuery] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setQuery(q);
  }
  const navigate = Route.useNavigate();
  const [size, setSize] = useState<Size | "all">("all");
  const [availability, setAvailability] = useState<Availability>("all");

  const { data } = useSuspenseQuery(storefrontQuery);
  const term = query.trim().toLowerCase();
  const filtered = data.products.filter((p) => {
    if (
      term &&
      ![p.name, p.category, p.editorial].some((f) => f.toLowerCase().includes(term))
    )
      return false;
    if (category !== "all" && p.category !== category) return false;
    if (size !== "all" && p.stock[size] === 0 && totalStock(p) > 0) return false;
    if (availability === "in-stock" && totalStock(p) === 0) return false;
    if (availability === "pre-order" && totalStock(p) > 0) return false;
    return true;
  });
  const products = useMemo(() => {
    const list = filtered.map((p, i) => ({ p, i }));
    if (sort === "featured") list.sort((a, b) => Number(b.p.isNew) - Number(a.p.isNew) || a.i - b.i);
    if (sort === "price-asc") list.sort((a, b) => a.p.price - b.p.price);
    if (sort === "price-desc") list.sort((a, b) => b.p.price - a.p.price);
    return list.map((x) => x.p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.map((p) => p.id).join(), sort]);
  const syncQuery = (value: string) => {
    setQuery(value);
    navigate({ search: (prev) => ({ ...prev, q: value || undefined }), replace: true });
  };

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search pieces</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => syncQuery(e.target.value)}
                placeholder="Search by name, category or description"
                className="h-11 w-full border border-border bg-background pl-10 pr-10 text-sm outline-none transition-colors focus:border-foreground [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => syncQuery("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <label className="flex items-center gap-2">
              <span className="eyebrow text-muted-foreground">Sort</span>
              <select
                value={sort}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      sort: e.target.value === "featured" ? undefined : (e.target.value as "price-asc" | "price-desc"),
                    }),
                    replace: true,
                  })
                }
                className="h-11 border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
              >
                <option value="featured">Featured / Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2 text-muted-foreground">Category</span>
            {(["all", "clothing", "accessories"] as const).map((c) => (
              <button
                key={c}
                className={pill(category === c)}
                onClick={() => navigate({ search: (prev) => ({ ...prev, category: c }) })}
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

        <p className="mt-6 text-xs text-muted-foreground">{products.length} {products.length === 1 ? "piece" : "pieces"}
          {term && <> matching “{query.trim()}”</>}
        </p>
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
