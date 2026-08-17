import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { naira } from "@/lib/format";
import { ProductImage } from "./ProductImage";

export function CartDrawer() {
  const { lines, isOpen, setOpen, updateQuantity, removeLine, subtotal, count } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="eyebrow text-left">Your bag ({count})</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-2xl">Your bag is empty.</p>
            <p className="text-sm text-muted-foreground">Explore our new arrivals!</p>
            <Button asChild className="mt-2 rounded-none px-8">
              <Link to="/new-arrivals" onClick={() => setOpen(false)}>
                Shop new arrivals
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="space-y-6">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-4">
                    <ProductImage
                      src={line.image}
                      alt={line.name}
                      className="h-28 w-20 shrink-0"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{line.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Size {line.size}</p>
                        </div>
                        <button
                          onClick={() => removeLine(line.id)}
                          aria-label={`Remove ${line.name}`}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {line.preOrder && (
                        <p className="mt-1 text-[11px] text-accent-foreground/80">
                          Pre-order — fulfills in 2–3 weeks
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-border">
                          <button
                            className="px-2 py-1 transition-colors hover:bg-muted"
                            aria-label="Decrease quantity"
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-8 text-center text-sm">{line.quantity}</span>
                          <button
                            className="px-2 py-1 transition-colors hover:bg-muted"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm">{naira(line.price * line.quantity)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="eyebrow">Subtotal</span>
                <span className="font-medium">{naira(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Shipping calculated at checkout. We do not accept payment on delivery.
              </p>
              <Button asChild className="mt-4 w-full rounded-none py-6">
                <Link to="/checkout" onClick={() => setOpen(false)}>
                  Proceed to secure checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
