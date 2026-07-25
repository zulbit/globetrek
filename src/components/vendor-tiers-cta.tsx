import { Link } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import { TIERS, formatTierPrice } from "@/lib/pricing";

const HIGHLIGHTS: Record<string, string[]> = {
  free: ["3 active listings", "5 lead credits / month", "Community support"],
  starter: ["30 listings — Visa · Insurance · Tickets", "60 lead credits / month", "AI listing descriptions"],
  pro: ["Unlimited tour listings", "250 lead credits / month", "AI trip planner + priority placement"],
  agency: ["Everything in Pro", "Multi-user seats + white-label", "Dedicated success manager"],
};

const CARD_TIERS = TIERS.filter((t) => t.id !== "free");

export function VendorTiersCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-10 flex flex-col items-start gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-highlight">
            For agencies
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            List your tours. Pick your archetype.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Pakistan's fastest-growing international travel marketplace. Pay for leads,
            not bookings — and scale from a home desk to a full agency.
          </p>
        </div>
        <Link
          to="/pricing"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Compare all plans →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {CARD_TIERS.map((tier) => {
          const isFeatured = tier.highlight;
          const bullets = HIGHLIGHTS[tier.id] ?? tier.features.slice(0, 3);
          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-3xl border p-8 transition-all ${
                isFeatured
                  ? "border-primary bg-card shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]"
                  : "border-border bg-card hover:-translate-y-1 hover:border-border/80"
              }`}
            >
              {isFeatured && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                  <Star className="size-3 fill-current" /> Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {tier.name}
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {tier.covers.length === 4 ? "All services" : `${tier.covers.length} services`}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className={`font-display text-4xl font-extrabold ${isFeatured ? "text-primary" : ""}`}>
                  {formatTierPrice(tier.price_pkr)}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.archetype}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <Check className={`mt-0.5 size-4 shrink-0 ${isFeatured ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  isFeatured
                    ? "bg-primary text-primary-foreground shadow-glow hover:brightness-110"
                    : "border border-border bg-surface hover:bg-card"
                }`}
              >
                {tier.id === "agency" ? "Talk to sales" : `Start as ${tier.name}`}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold">Ready when you are.</h3>
          <p className="text-sm text-muted-foreground">
            Sign up in 60 seconds — no card required for the free tier.
          </p>
        </div>
        <div className="mt-4 flex gap-3 sm:mt-0">
          <Link
            to="/tours"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-card"
          >
            I'm a traveler
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:brightness-110"
          >
            List your tours →
          </Link>
        </div>
      </div>
    </section>
  );
}
