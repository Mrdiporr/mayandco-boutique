import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/store/Layout";

export const Route = createFileRoute("/payment-policy")({
  head: () => ({
    meta: [
      { title: "No Payment on Delivery — MAY & CO. Payment Policy" },
      {
        name: "description",
        content:
          "MAY & CO. operates a strictly pre-paid store. Orders are confirmed by card or instant bank transfer only — payment on delivery is not accepted.",
      },
      { property: "og:title", content: "No Payment on Delivery — MAY & CO." },
      {
        property: "og:description",
        content: "A strictly pre-paid store: card or instant bank transfer only.",
      },
    ],
  }),
  component: PaymentPolicyPage,
});

function PaymentPolicyPage() {
  return (
    <Layout>
      <PageHeader eyebrow="Store Policy" title="Strictly No Payment on Delivery" />
      <div className="mx-auto max-w-2xl space-y-8 px-4 pb-10 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:px-10">
        <div className="border border-accent bg-accent/10 p-6 text-foreground">
          <p className="eyebrow">Please note</p>
          <p className="mt-3 text-sm">
            MAY & CO. does not accept cash or card payment on delivery under any circumstance. All
            orders must be fully paid before dispatch.
          </p>
        </div>
        <section>
          <h2 className="font-display text-xl text-foreground">Accepted methods</h2>
          <p className="mt-3">
            Debit or credit card via our secure processor, and instant bank transfer with automated
            verification. Both are completed inside checkout — never over DM.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Why we operate pre-paid</h2>
          <p className="mt-3">
            Pre-payment protects our couriers, keeps dispatch same-day, and lets us hold limited
            pieces for confirmed buyers only.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-foreground">Fraud notice</h2>
          <p className="mt-3">
            We will never request payment to a personal account. Verify account details on this
            checkout page only.
          </p>
        </section>
      </div>
    </Layout>
  );
}
