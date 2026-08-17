import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/cart";
import { cn } from "@/lib/utils";

const linkClass =
  "eyebrow text-foreground/80 transition-colors hover:text-foreground data-[status=active]:text-foreground";

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/90 backdrop-blur-md"
          : "border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <button
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="font-display text-lg tracking-[0.28em] md:text-xl">
          MAY&nbsp;&&nbsp;CO.
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link to="/shop" className={linkClass}>
              Shop All
            </Link>
            <div
              className={cn(
                "absolute left-1/2 top-full w-48 -translate-x-1/2 border border-border bg-background p-4 shadow-sm transition-all duration-200",
                shopOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0",
              )}
            >
              <Link
                to="/shop"
                search={{ category: "clothing" }}
                className="block py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Clothing
              </Link>
              <Link
                to="/shop"
                search={{ category: "accessories" }}
                className="block py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Accessories
              </Link>
            </div>
          </div>
          <Link to="/new-arrivals" className={linkClass}>
            New Arrivals
          </Link>
          <Link to="/pre-order" className={linkClass}>
            Pre-Order Hub
          </Link>
        </nav>

        <button
          onClick={() => setOpen(true)}
          aria-label={`Open bag, ${count} items`}
          className="relative"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] font-medium text-accent-foreground">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-display text-lg tracking-[0.28em]">MAY & CO.</span>
          <button aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-8">
          {[
            { to: "/shop" as const, label: "Shop All" },
            { to: "/new-arrivals" as const, label: "New Arrivals" },
            { to: "/pre-order" as const, label: "Pre-Order Hub" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="border-b border-border py-5 font-display text-2xl"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/shop"
            search={{ category: "clothing" }}
            onClick={() => setMenuOpen(false)}
            className="pt-6 text-sm text-muted-foreground"
          >
            Clothing
          </Link>
          <Link
            to="/shop"
            search={{ category: "accessories" }}
            onClick={() => setMenuOpen(false)}
            className="pt-3 text-sm text-muted-foreground"
          >
            Accessories
          </Link>
        </nav>
      </div>
    </header>
  );
}
