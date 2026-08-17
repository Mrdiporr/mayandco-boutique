import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="fade-up mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-10">
      {eyebrow && <p className="eyebrow text-muted-foreground">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-4xl leading-[1.05] md:text-6xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
