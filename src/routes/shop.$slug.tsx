import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/store/Layout";
import { ProductImage } from "@/components/store/ProductImage";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PRODUCTS, SIZES, getProduct, type Size } from "@/lib/products";
import { naira } from "@/lib/format";
import { useCart } from "@/context/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Piece unavailable — MAY & CO." }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const description = `${product.name} — ${naira(product.price)}. ${product.editorial}`.slice(
      0,
      155,
    );
    return {
      meta: [
        { title: `${product.name} — MAY & CO.` },
        { name: "description", content: description },
        { property: "og:title", content: `${product.name} — MAY & CO.` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { addLine } = useCart();
  const [size, setSize] = useState<Size | null>(null);

  const selectedStock = size ? product.stock[size] : null;
  const isPreOrder = selectedStock === 0;

  const related = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 4);

  const handleAdd = () => {
    if (!size) {
      toast.error("Select a size first");
      return;
    }
    addLine({
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      size,
      preOrder: isPreOrder,
    });
    toast.success(isPreOrder ? "Pre-order added to bag" : "Added to bag");
  };

  const ctaLabel = !size
    ? "Select a size"
    : isPreOrder
      ? "Pre-Order (Fulfills in 2–3 Weeks)"
      : "Add to Cart (Next Day Dispatch)";

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        <nav className="eyebrow text-muted-foreground">
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <article className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-10">
        <div className="fade-up">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="aspect-[3/4] w-full"
            priority
          />
        </div>

        <div className="fade-up md:pt-6">
          <p className="eyebrow text-muted-foreground">{product.category}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg">{naira(product.price)}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.editorial}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Size</p>
              <span className="text-xs text-muted-foreground">S – XXL</span>
            </div>
            <div
              role="radiogroup"
              aria-label="Select size"
              className="mt-3 grid grid-cols-5 gap-2"
            >
              {SIZES.map((s) => {
                const stock = product.stock[s];
                const active = size === s;
                return (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSize(s)}
                    className={cn(
                      "relative border py-3 text-sm transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {s}
                    {stock === 0 && (
                      <span
                        className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {size === null
                ? "Sizes marked with an amber dot are available on pre-order."
                : isPreOrder
                  ? "This size is currently sold out — reserve it now and we fulfill within 2–3 weeks."
                  : `${selectedStock} left in size ${size} — dispatched next business day.`}
            </p>
          </div>

          <Button
            onClick={handleAdd}
            variant={isPreOrder ? "outline" : "default"}
            className={cn(
              "mt-7 w-full rounded-none py-7 text-sm",
              isPreOrder &&
                "border-2 !border-accent !bg-transparent !text-foreground hover:!bg-accent/15",
            )}
          >
            {ctaLabel}
          </Button>


          <p className="mt-3 text-center text-xs text-muted-foreground">
            Payment is required upfront. We do not accept payment on delivery.
          </p>

          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="details">
              <AccordionTrigger className="eyebrow">Details & Care</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {product.details.map((d) => (
                    <li key={d}>— {d}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="eyebrow">Shipping & Dispatch</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                In-stock pieces are dispatched the next business day in Lagos and within 2–4
                working days nationwide. Pre-orders fulfill within 2–3 weeks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="exchange">
              <AccordionTrigger className="eyebrow">Exchange Policy</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Size exchanges accepted within 48 hours of delivery on unworn pieces with tags
                intact. Pre-order and sale pieces are final sale.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </article>

      <section className="mx-auto max-w-7xl border-t border-border px-4 py-16 sm:px-6 lg:px-10">
        <h2 className="font-display text-2xl md:text-3xl">You may also like</h2>
        <div className="mt-8">
          <ProductGrid products={related} />
        </div>
      </section>
    </Layout>
  );
}
