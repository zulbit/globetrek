import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileCheck, Shield, Ticket } from "lucide-react";

const CATEGORIES = [
  {
    title: "Visa services",
    tagline: "Turkey, Schengen, UAE, UK — expert paperwork",
    icon: FileCheck,
    to: "/visa",
    tint: "from-sky-500/20 to-transparent",
    border: "border-sky-500/30 hover:border-sky-500/60",
    icon_bg: "bg-sky-500/15 text-sky-400",
  },
  {
    title: "Travel insurance",
    tagline: "Schengen, medical, family plans in PKR",
    icon: Shield,
    to: "/insurance",
    tint: "from-emerald-500/20 to-transparent",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    icon_bg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "Flight tickets",
    tagline: "Domestic, international, Umrah & Hajj",
    icon: Ticket,
    to: "/tickets",
    tint: "from-amber-500/20 to-transparent",
    border: "border-amber-500/30 hover:border-amber-500/60",
    icon_bg: "bg-amber-500/15 text-amber-400",
  },
];

export function ServicesStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Beyond tours</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need for the journey
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visa consultants, insurers, and ticketing agents — all vetted, all priced in PKR.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 ${c.border}`}
            >
              <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-radial ${c.tint} blur-2xl`} />
              <div className="relative flex items-start justify-between">
                <div className={`grid size-11 place-items-center rounded-xl ${c.icon_bg} ring-1 ring-white/10`}>
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="relative mt-6">
                <h3 className="text-lg font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
