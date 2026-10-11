import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/cart";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/img-2320.asset.json";


const linkClass =
  "eyebrow text-foreground/80 transition-colors hover:text-foreground data-[status=active]:text-foreground";

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate({ to: "/shop", search: { category: "all", q: q || undefined } });
    setTerm("");
  };

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

        <Link to="/" aria-label="MAY & CO. home" className="shrink-0">
          <img src={logoAsset.url} alt="MAY & CO." className="h-9 w-auto md:h-11" />
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
          <Link to="/catalogue" className={linkClass}>
            Catalogue
          </Link>

        </nav>

        <div className="flex items-center gap-5">
        <button
          aria-label={searchOpen ? "Close search" : "Search the store"}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((v) => !v)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
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
      </div>

      {searchOpen && (
        <form
          onSubmit={submitSearch}
          className="border-t border-border bg-background animate-in fade-in slide-in-from-top-1"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              placeholder="Search dresses, sets, caps…"
              aria-label="Search the store"
              className="h-10 flex-1 bg-transparent text-sm outline-none"
            />
            <button type="submit" className="eyebrow border border-foreground px-4 py-2 hover:bg-foreground hover:text-background">
              Search
            </button>
          </div>
        </form>
      )}

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <img src={logoAsset.url} alt="MAY & CO." className="h-9 w-auto" />
          <button aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-8">
          <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2 border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search the store"
              aria-label="Search the store"
              className="h-12 flex-1 bg-transparent text-sm outline-none"
            />
          </form>
          {[
            { to: "/shop" as const, label: "Shop All" },
            { to: "/new-arrivals" as const, label: "New Arrivals" },
            { to: "/pre-order" as const, label: "Pre-Order Hub" },
            { to: "/catalogue" as const, label: "Catalogue" },
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
