import { Fragment, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Minus, Sparkles, Globe2, FileCheck, Shield, Ticket, ArrowRight, Star, Zap, Crown, Rocket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { TIERS, formatTierPrice, SERVICE_LABELS, type ServiceCategory } from "@/lib/pricing";
import { getSubscriptionPlans } from "@/lib/payments.functions";

const ICON_MAP: Record<string, typeof Sparkles> = {
  Sparkles,
  Zap,
  Crown,
  Rocket,
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Vendor Pricing · GlobeTrek PK" },
      {
        name: "description",
        content:
          "Plans built around your business — Tour Operator, Travel Desk (visa · insurance · tickets), or Full Agency. Transparent monthly pricing in PKR.",
      },
      { property: "og:title", content: "Vendor Pricing · GlobeTrek PK" },
      {
        property: "og:description",
        content:
          "Pick the plan that matches how you sell travel: tour operator, ticketing/visa desk, or full-service agency.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type CompareRow = { label: string; key: keyof (typeof TIERS)[number]["limits"]; hint?: string };
type CompareGroup = { title: string; rows: CompareRow[] };

const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: "Listings & reach",
    rows: [
      { label: "Active listings", key: "listings", hint: "How many services you can publish" },
      { label: "Service categories", key: "services", hint: "Tours, visa, insurance, tickets" },
      { label: "Search placement", key: "placement" },
    ],
  },
  {
    title: "Leads & conversion",
    rows: [
      { label: "Lead credits", key: "leadCredits", hint: "1 credit unlocks 1 customer's contact info" },
    ],
  },
  {
    title: "AI concierge tools",
    rows: [
      { label: "AI listing descriptions", key: "aiDrafts" },
      { label: "AI full-trip planner", key: "aiPlans" },
    ],
  },
  {
    title: "Support",
    rows: [{ label: "Response SLA", key: "support" }],
  },
];

const CATEGORY_ICON: Record<ServiceCategory, typeof Globe2> = {
  tours: Globe2, visa: FileCheck, insurance: Shield, tickets: Ticket,
};

/** Render a cell value with iconography instead of raw text glyphs. */
function CellValue({ value, highlight }: { value: string; highlight?: boolean }) {
  if (value === "—") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground/50">
        <Minus className="size-4" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  const isUnlimited = /unlimited|featured|priority|dedicated/i.test(value);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check
        className={`size-4 shrink-0 ${
          isUnlimited
            ? "text-primary"
            : highlight
              ? "text-primary/80"
              : "text-emerald-400/70"
        }`}
      />
      <span className={`text-sm ${highlight ? "font-medium text-foreground" : "text-foreground/90"}`}>
        {value}
      </span>
    </span>
  );
}

function PricingPage() {
  const getPlansFn = useServerFn(getSubscriptionPlans);
  const { data: dbPlans } = useQuery({
    queryKey: ["subscription-plans-config-public"],
    queryFn: () => getPlansFn(),
  });

  const activePlans = useMemo(() => {
    if (!dbPlans || dbPlans.length === 0) return TIERS;
    return dbPlans.map((p) => ({
      ...p,
      icon: ICON_MAP[p.iconName] || Crown,
    }));
  }, [dbPlans]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Vendor plans
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Pick the plan that matches how you sell travel.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Whether you run a tour operation, a visa &amp; ticketing desk, or a
            full-service agency doing all of it — there's a plan sized for you.
            Transparent monthly pricing in PKR, cancel anytime.
          </p>
        </div>
      </section>

      {/* Archetype picker */}
      <section className="mx-auto -mt-4 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {activePlans.filter((t) => t.id !== "free").map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.id}
                href={`#plan-${t.id}`}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                  t.highlight
                    ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ${
                    t.highlight
                      ? "bg-primary/20 text-primary ring-primary/40"
                      : "bg-surface text-muted-foreground ring-border"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    For {t.name.toLowerCase()}s
                  </div>
                  <div className="text-sm font-semibold text-foreground">{t.archetype}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    From {formatTierPrice(t.price_pkr)} / month
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>


      {/* Tier cards */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activePlans.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                id={`plan-${tier.id}`}
                className={`relative flex flex-col scroll-mt-24 rounded-2xl border p-5 shadow-card transition-transform hover:-translate-y-0.5 ${
                  tier.highlight
                    ? "border-primary/50 bg-linear-to-b from-primary/10 to-card ring-1 ring-primary/30"
                    : "border-border bg-card"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                    Most popular
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`grid size-9 place-items-center rounded-xl ring-1 ${
                      tier.highlight
                        ? "bg-primary/20 text-primary ring-primary/40"
                        : "bg-surface text-muted-foreground ring-border"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{tier.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{tier.tagline}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums">
                    {formatTierPrice(tier.price_pkr)}
                  </span>
                  {tier.price_pkr > 0 && (
                    <span className="text-xs text-muted-foreground">/ month</span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {tier.covers.map((c) => {
                    const CI = CATEGORY_ICON[c];
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        title={SERVICE_LABELS[c].label}
                      >
                        <CI className="size-3" /> {SERVICE_LABELS[c].short}
                      </span>
                    );
                  })}
                </div>



                <ul className="mb-5 space-y-2 text-xs">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.id === "free" ? (
                  <Button asChild size="sm" variant="secondary" className="mt-auto w-full">
                    <Link to="/auth" search={{ mode: "signup" } as never}>Start free</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className={`mt-auto w-full ${
                      tier.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-surface-2 text-foreground hover:bg-surface"
                    }`}
                  >
                    <Link to="/vendor/billing">Choose {tier.name}</Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Compare plans — redesigned */}
      <section id="compare" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Side by side
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Compare every plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Grouped by what actually grows revenue — reach, leads, AI, support.
            </p>
          </div>
          <div className="hidden items-center gap-4 text-xs text-muted-foreground md:flex">
            <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400/70" /> Included</span>
            <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Unlimited / priority</span>
            <span className="inline-flex items-center gap-1.5"><Minus className="size-3.5 text-muted-foreground/50" /> Not included</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_0_hsl(var(--border))_inset]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-0">
              {/* Plan header row */}
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[240px] bg-card p-5 text-left align-bottom">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Features
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      All prices in PKR, billed monthly.
                    </p>
                  </th>
                  {activePlans.map((t) => {
                    const Icon = t.icon;
                    return (
                      <th
                        key={t.id}
                        className={`relative p-5 text-left align-bottom ${
                          t.highlight
                            ? "bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
                            : ""
                        }`}
                      >
                        {t.highlight && (
                          <span className="absolute left-5 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
                            <Star className="size-3 fill-current" /> Recommended
                          </span>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                          <span
                            className={`grid size-7 place-items-center rounded-md ring-1 ${
                              t.highlight
                                ? "bg-primary/20 text-primary ring-primary/40"
                                : "bg-surface text-muted-foreground ring-border"
                            }`}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <span className="text-sm font-semibold text-foreground">{t.name}</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className={`text-2xl font-bold tracking-tight ${t.highlight ? "text-primary" : "text-foreground"}`}>
                            {formatTierPrice(t.price_pkr)}
                          </span>
                          {t.price_pkr > 0 && (
                            <span className="text-xs text-muted-foreground">/mo</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                          {t.tagline}
                        </p>
                        <Button
                          asChild
                          size="sm"
                          variant={t.highlight ? "default" : "outline"}
                          className="mt-4 h-8 w-full text-xs font-medium"
                        >
                          <Link to="/auth" search={{ mode: "signup", role: "vendor" }}>
                            {t.price_pkr === 0 ? "Start free" : "Choose plan"}
                            <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {t.covers.map((c) => {
                            const CIcon = CATEGORY_ICON[c];
                            return (
                              <span
                                key={c}
                                title={SERVICE_LABELS[c].label}
                                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal text-muted-foreground"
                              >
                                <CIcon className="size-2.5" />
                                {SERVICE_LABELS[c].short}
                              </span>
                            );
                          })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Grouped feature rows */}
              <tbody>
                {COMPARE_GROUPS.map((group, gi) => (
                  <Fragment key={group.title}>
                    <tr>
                      <td
                        colSpan={activePlans.length + 1}
                        className={`border-t border-border bg-surface/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                          gi === 0 ? "border-t-2" : ""
                        }`}
                      >
                        {group.title}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.key} className="group">
                        <td className="sticky left-0 z-10 w-[240px] bg-card px-5 py-3.5 align-top">
                          <div className="text-sm text-foreground">{row.label}</div>
                          {row.hint && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">{row.hint}</div>
                          )}
                        </td>
                        {activePlans.map((t) => (
                          <td
                            key={t.id}
                            className={`px-5 py-3.5 align-top ${
                              t.highlight
                                ? "bg-primary/[0.04] ring-1 ring-inset ring-primary/10"
                                : ""
                            }`}
                          >
                            <CellValue value={t.limits[row.key]} highlight={t.highlight} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile legend */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground md:hidden">
          <span className="inline-flex items-center gap-1"><Check className="size-3 text-emerald-400/70" /> Included</span>
          <span className="inline-flex items-center gap-1"><Check className="size-3 text-primary" /> Unlimited</span>
          <span className="inline-flex items-center gap-1"><Minus className="size-3 text-muted-foreground/50" /> —</span>
        </div>


        {/* FAQ */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            {
              q: "I only sell visa & ticketing — do I need to pay for tour features?",
              a: "No. The Travel Desk plan (₨ 4,000/mo) is built exactly for you — visa, insurance and ticket listings without paying for tour-only AI tools.",
            },
            {
              q: "I do both tours and visa/tickets — which plan?",
              a: "Go with Full Agency (₨ 12,000/mo). It's the only plan that unlocks all four service categories in one account, plus unlimited AI and featured placement.",
            },
            {
              q: "How do lead credits work?",
              a: "1 credit unlocks 1 customer's contact info from an inquiry. Unused credits do not roll over each month.",
            },
            {
              q: "Can I switch or cancel anytime?",
              a: "Yes. Upgrade, downgrade, or cancel from your vendor dashboard — no long-term contract.",
            },
            {
              q: "What is the AI trip planner?",
              a: "A tool available on the Tour Operator and Full Agency plans that drafts full day-by-day itineraries and marketing descriptions from your tour basics, in seconds.",
            },
            {
              q: "Do you charge transaction fees?",
              a: "No. GlobeTrek PK is a lead-generation marketplace. You keep 100% of the booking revenue.",
            },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">{f.q}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
