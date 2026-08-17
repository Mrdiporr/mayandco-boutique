import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/products";

export function ProductGrid({
  products,
  emptyMessage = "No pieces match this filter yet.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-border px-6 py-20 text-center">
        <p className="font-display text-xl">Nothing here — yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
