import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-xl tracking-[0.28em]">MAY & CO.</p>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Curated female apparel and accessories. Luxury street silhouettes, sourced and
              styled in Nigeria.
            </p>
            <a
              href="https://instagram.com/mayandco.ng"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            >
              <Instagram className="h-4 w-4" />
              @mayandco.ng
            </a>
            {/* Reserved slots for upcoming Snapchat and TikTok embeds */}
            <p className="mt-3 text-xs text-muted-foreground">Snapchat & TikTok — coming soon</p>
          </div>

          <div>
            <p className="eyebrow text-muted-foreground">Store Policy</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/shipping" className="transition-opacity hover:opacity-60">
                  Shipping & Dispatch
                </Link>
              </li>
              <li>
                <Link to="/exchange-policy" className="transition-opacity hover:opacity-60">
                  Exchange Policy
                </Link>
              </li>
              <li>
                <Link to="/payment-policy" className="transition-opacity hover:opacity-60">
                  No Payment on Delivery
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-muted-foreground">Shop</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/shop" className="transition-opacity hover:opacity-60">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="transition-opacity hover:opacity-60">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/pre-order" className="transition-opacity hover:opacity-60">
                  Pre-Order Hub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border border-border bg-muted/50 p-6">
          <p className="eyebrow text-muted-foreground">Legal Disclaimer</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Mayandco.ng is an independent retailer. Brand names, logos, and trademarks displayed
            remain the sole property of their respective owners and are utilized strictly for
            product descriptive purposes.
          </p>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} MAY & CO. All rights reserved. Lagos, Nigeria.
        </p>
      </div>
    </footer>
  );
}
