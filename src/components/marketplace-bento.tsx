import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Sparkles,
  Zap,
  Wallet,
  FileCheck,
  MessageCircle,
  BarChart3,
} from "lucide-react";

export function MarketplaceBento() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-10 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Why GlobeTrek PK
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            One marketplace. Two sides. Zero friction.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Everything a Pakistani traveler needs to leave the country — and every tool a
            local agency needs to fill the seat.
          </p>
        </div>
        <div className="flex gap-2 text-[11px] font-semibold uppercase tracking-widest">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Travelers</span>
          <span className="rounded-full bg-highlight/10 px-3 py-1 text-highlight">Vendors</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[repeat(3,minmax(0,1fr))] md:h-[640px]">
        {/* Big traveler tile */}
        <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-colors hover:border-primary/40 md:col-span-2 md:row-span-2">
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="size-3.5" /> For travelers
              </span>
              <h3 className="font-display text-3xl font-bold leading-tight">
                Book the world in <span className="text-primary">PKR</span>. No FX surprises.
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Curated packages to Turkey, Thailand, UAE, Europe & beyond — priced upfront
                in rupees by verified Pakistani agencies. Pay by bank transfer, JazzCash,
                Easypaisa or card.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm">
              {[
                "100% verified local agencies",
                "24/7 AI concierge (Urdu + English)",
                "Visa · Insurance · Tickets in one flow",
                "WhatsApp callbacks in minutes",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5 text-foreground/90">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/tours"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Browse tours →
              </Link>
              <Link
                to="/visa"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold transition-colors hover:bg-card"
              >
                Explore visas
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
        </div>

        {/* Vendor lead engine */}
        <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-colors hover:border-highlight/40 md:col-span-2">
          <div className="flex items-start gap-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-highlight/10">
              <Zap className="size-7 text-highlight" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-highlight">
                For vendors
              </span>
              <h3 className="font-display text-xl font-bold">Lead engine, not a booking fee</h3>
              <p className="text-sm text-muted-foreground">
                Get high-intent inquiries filtered by budget, city and travel date. Unlock
                contacts with credits — no per-booking commission, ever.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-service */}
        <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/30 md:col-span-2">
          <div className="flex items-start gap-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10">
              <FileCheck className="size-7 text-primary" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                For travelers
              </span>
              <h3 className="font-display text-xl font-bold">Visa · Insurance · Tickets, together</h3>
              <p className="text-sm text-muted-foreground">
                One profile handles your Schengen paperwork, travel insurance and group
                fares — no more juggling five WhatsApp groups.
              </p>
            </div>
          </div>
        </div>

        {/* AI concierge stat */}
        <div className="group rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-full flex-col justify-between gap-4">
            <Sparkles className="size-6 text-primary" />
            <div>
              <p className="font-display text-3xl font-bold text-primary">AI</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Concierge chat · plans your trip in seconds
              </p>
            </div>
          </div>
        </div>

        {/* PKR pricing */}
        <div className="group rounded-3xl border border-border bg-card p-6 transition-colors hover:border-highlight/30">
          <div className="flex h-full flex-col justify-between gap-4">
            <Wallet className="size-6 text-highlight" />
            <div>
              <p className="font-display text-3xl font-bold text-highlight">₨ PKR</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                All-in pricing · 0% hidden FX fees
              </p>
            </div>
          </div>
        </div>

        {/* Visa success */}
        <div className="group rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-full flex-col justify-between gap-4">
            <ShieldCheck className="size-6 text-primary" />
            <div>
              <p className="font-display text-3xl font-bold text-primary">98%</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Visa approval rate across verified vendors
              </p>
            </div>
          </div>
        </div>

        {/* Vendor analytics */}
        <div className="group rounded-3xl border border-border bg-card p-6 transition-colors hover:border-highlight/30">
          <div className="flex h-full flex-col justify-between gap-4">
            <BarChart3 className="size-6 text-highlight" />
            <div>
              <p className="font-display text-3xl font-bold text-highlight">Live</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Vendor dashboard · leads, credits, AI usage
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp callback */}
        <div className="group rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/30 md:col-span-2">
          <div className="flex h-full items-center justify-between gap-6">
            <div className="min-w-0 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                For travelers
              </span>
              <h3 className="font-display text-lg font-bold">WhatsApp callbacks — no forms.</h3>
              <p className="text-sm text-muted-foreground">
                One tap on any tour, agent replies on your WhatsApp within minutes.
              </p>
            </div>
            <MessageCircle className="size-10 shrink-0 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
