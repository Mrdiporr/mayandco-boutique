import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/store/Layout";

export const Route = createFileRoute("/exchange-policy")({
  head: () => ({
    meta: [
      { title: "Exchange Policy — MAY & CO." },
      {
        name: "description",
        content:
          "MAY & CO. exchange terms: size exchanges within 48 hours of delivery on unworn pieces with tags intact. Pre-order pieces are final sale.",
      },
      { property: "og:title", content: "Exchange Policy — MAY & CO." },
      {
        property: "og:description",
        content: "Size exchanges within 48 hours on unworn pieces with tags intact.",
      },
    ],
  }),
  component: ExchangePage,
});

function ExchangePage() {
  return (
    <Layout>
      <PageHeader eyebrow="Store Policy" title="Exchange Policy" />
      <div className="mx-auto max-w-2xl space-y-8 px-4 pb-10 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:px-10">
        <section>
          <h2 className="font-display text-xl text-foreground">Size exchanges</h2>
          <p className="mt-3">
            We accept size exchanges requested within 48 hours of delivery. Pieces must be unworn,
            unwashed, and returned with all tags intact in original packaging.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Final sale</h2>
          <p className="mt-3">
            Pre-order pieces, accessories, and any item purchased during a promotional period are
            final sale and cannot be exchanged.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Refunds</h2>
          <p className="mt-3">
            We do not offer cash refunds. Where an exchange is not possible we issue store credit
            valid for six months.
          </p>
        </section>
      </div>
    </Layout>
  );
}
