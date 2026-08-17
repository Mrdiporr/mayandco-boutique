import { Link } from "@tanstack/react-router";
import { ProductImage } from "./ProductImage";
import { naira } from "@/lib/format";
import { totalStock, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = totalStock(product) === 0;

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group block"
      aria-label={product.name}
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="aspect-[3/4]"
          imgClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        {product.isNew && !soldOut && (
          <span className="eyebrow absolute left-3 top-3 bg-primary px-2.5 py-1 text-primary-foreground">
            New
          </span>
        )}
        {soldOut && (
          <span className="eyebrow absolute left-3 top-3 border border-accent bg-background/90 px-2.5 py-1 text-foreground">
            Pre-Order
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-sans text-sm font-medium tracking-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{naira(product.price)}</p>
        {soldOut ? (
          <p className="text-xs text-accent-foreground/80">
            <span className="border-b border-accent pb-px">Pre-order — fulfills in 2–3 weeks</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Next day dispatch in Lagos</p>
        )}
      </div>
    </Link>
  );
}
