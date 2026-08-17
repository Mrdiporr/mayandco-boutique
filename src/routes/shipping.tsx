import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/store/Layout";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Dispatch — MAY & CO." },
      {
        name: "description",
        content:
          "MAY & CO. shipping timelines: next-day dispatch in Lagos, 2–4 working days nationwide, and 2–3 week pre-order fulfillment.",
      },
      { property: "og:title", content: "Shipping & Dispatch — MAY & CO." },
      {
        property: "og:description",
        content: "Next-day dispatch in Lagos and nationwide delivery timelines.",
      },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <Layout>
      <PageHeader eyebrow="Store Policy" title="Shipping & Dispatch" />
      <div className="mx-auto max-w-2xl space-y-8 px-4 pb-10 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:px-10">
        <section>
          <h2 className="font-display text-xl text-foreground">Dispatch windows</h2>
          <p className="mt-3">
            In-stock orders confirmed before 4pm WAT are dispatched the next business day within
            Lagos. Nationwide deliveries arrive within 2–4 working days via our courier partners.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Pre-orders</h2>
          <p className="mt-3">
            Pre-ordered pieces are fulfilled within 2–3 weeks from the date payment clears. Where
            an order contains both in-stock and pre-order pieces, we ship in two parcels at no
            extra cost.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Tracking</h2>
          <p className="mt-3">
            A tracking reference is issued by email and WhatsApp the moment your parcel leaves our
            studio.
          </p>
        </section>
      </div>
    </Layout>
  );
}
