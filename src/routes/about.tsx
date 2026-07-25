import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · GlobeTrek PK" },
      { name: "description", content: "An international tour marketplace for Pakistani travellers, priced in PKR." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          A global marketplace, priced in PKR.
        </h1>
        <div className="prose prose-invert mt-6 space-y-4 text-muted-foreground">
          <p>
            GlobeTrek PK is an international travel marketplace where verified Pakistani travel
            vendors list their global tour packages — Turkey, Thailand, UAE, Europe and beyond —
            for customers to book directly in Pakistani Rupee.
          </p>
          <p>
            All prices are quoted and charged in PKR (₨). No conversion fees, no surprise
            supplements, no hidden costs. Vendors handle flights, visas, hotels and ground
            logistics; we handle discovery, trust, and payments.
          </p>
          <p>
            Are you a travel agency? Head to the vendor portal to list your packages.
          </p>
          <p>
            This is the Phase 1 UI shell — bookings, payments and vendor accounts arrive in
            Phase 2.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
