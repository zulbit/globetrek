import { Fragment, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Minus, Sparkles, Globe2, FileCheck, Shield, Ticket, ArrowRight, Star, Zap, Crown, Rocket, HelpCircle, Search, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// FUTURE MONETIZATION ROADMAP (Note: Do not create active plans for now):
// - Search Placement Plan: Top ranking placement in search results.
// - AI Placement Plan: Featured recommendations by AI Concierge.
// - Landing Page Placement Plan: Featured Agency Spotlight on landing page.
// - 1-Week Flash Banner Advertisement Plan: 7-Day promotional banner on landing page hero section.

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

  const activeBasePlans = useMemo(() => {
    if (!dbPlans || dbPlans.length === 0) return TIERS;
    const baseOnly = dbPlans.filter((p: any) => (p.plan_type || "base") === "base" && p.is_enabled !== false);
    if (baseOnly.length === 0) return TIERS;
    return baseOnly.map((p: any) => ({
      ...p,
      icon: ICON_MAP[p.icon_name || p.iconName] || Crown,
    }));
  }, [dbPlans]);

  const activePlans = activeBasePlans;

  const activeAddons = useMemo(() => {
    if (!dbPlans || dbPlans.length === 0) {
      // Default fallback addons if db table empty
      return [
        {
          id: "placement_search",
          name: "Search Placement Boost",
          plan_type: "placement",
          price_pkr: 8000,
          billing_period: "monthly",
          tagline: "Top #1-#3 search position boost in category queries",
          icon_name: "Search",
          features: [
            "Top 3 position ranking in search queries",
            "Featured badge on search result cards",
            "4x average traveler click-through rate",
            "Priority lead routing",
          ],
        },
        {
          id: "placement_ai",
          name: "AI Concierge Recommendation",
          plan_type: "placement",
          price_pkr: 12000,
          billing_period: "monthly",
          tagline: "Recommended by AI Concierge in Roman Urdu & English",
          icon_name: "Bot",
          features: [
            "Direct AI recommendation priority in chat queries",
            "AI Concierge booking link placement",
            "High-trust traveler lead conversions",
            "Weekly performance analytics report",
          ],
        },
        {
          id: "placement_landing",
          name: "Landing Page Spotlight",
          plan_type: "placement",
          price_pkr: 15000,
          billing_period: "monthly",
          tagline: "Featured Agency Spotlight card on main landing page",
          icon_name: "Globe2",
          features: [
            "Featured Agency Spotlight showcase on homepage",
            "Top hero slider package placement",
            "Maximum brand authority & trust",
            "Dedicated agency store link",
          ],
        },
        {
          id: "ad_flash_banner_1w",
          name: "1-Week Hero Flash Banner Ad",
          plan_type: "advertisement",
          price_pkr: 15000,
          billing_period: "weekly",
          tagline: "7-Day exclusive promotional banner on homepage hero",
          icon_name: "Sparkles",
          features: [
            "7-Day Hero Banner Ad on GlobeTrek PK homepage",
            "Custom CTA link to your specific package or store",
            "Ideal for seasonal sales (Umrah, Baku Winter, Eid Specials)",
            "Dedicated campaign analytics report",
          ],
        },
      ];
    }
    return dbPlans.filter((p: any) => (p.plan_type === "placement" || p.plan_type === "advertisement") && p.is_enabled !== false);
  }, [dbPlans]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Vendor plans &amp; Marketplace Add-ons
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
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {activeBasePlans.filter((t) => t.id !== "free").map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.id}
                href={`#plan-${t.id}`}
                className={`group flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 shadow-sm ${
                  t.highlight
                    ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${
                    t.highlight
                      ? "bg-primary/20 text-primary ring-primary/40"
                      : "bg-surface text-muted-foreground ring-border"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    For {t.name.toLowerCase()}s
                  </div>
                  <div className="text-xs font-semibold text-foreground leading-snug">{t.archetype}</div>
                  <div className="mt-1 text-[11px] font-mono text-primary">
                    From {formatTierPrice(t.price_pkr)} / month
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold mb-6 text-foreground">Base Vendor Subscriptions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {activeBasePlans.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                id={`plan-${tier.id}`}
                className={`relative flex flex-col justify-between scroll-mt-24 rounded-2xl border p-6 shadow-card transition-transform hover:-translate-y-0.5 ${
                  tier.highlight
                    ? "border-primary/50 bg-linear-to-b from-primary/10 to-card ring-1 ring-primary/30"
                    : "border-border bg-card"
                }`}
              >
                <div>
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
                    <span className="text-2xl font-extrabold tabular-nums font-mono">
                      {formatTierPrice(tier.price_pkr)}
                    </span>
                    {tier.price_pkr > 0 && (
                      <span className="text-xs text-muted-foreground">/ month</span>
                    )}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {(tier.covers || []).map((c: any) => {
                      const CI = CATEGORY_ICON[c as ServiceCategory];
                      if (!CI) return null;
                      return (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          title={SERVICE_LABELS[c as ServiceCategory]?.label}
                        >
                          <CI className="size-3" /> {SERVICE_LABELS[c as ServiceCategory]?.short}
                        </span>
                      );
                    })}
                  </div>

                  <ul className="mb-6 space-y-2 text-xs">
                    {(tier.features || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild
                  className={`w-full font-bold rounded-xl ${
                    tier.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-surface text-foreground border border-border hover:border-primary/40"
                  }`}
                >
                  <Link to="/auth" search={{ redirect: "/vendor/billing", mode: "signin" }}>
                    Select {tier.name} <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Marketplace Placement & Banner Ad Addons Section */}
      {activeAddons.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 border-t border-border mt-6">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
              <Zap className="size-3.5" /> Boost Your Agency Reach
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Marketplace Placement &amp; Flash Campaign Add-ons
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Attach optional high-impact visibility boosts to your existing vendor plan. Stand out in AI Concierge recommendations, search rankings, or hero banners.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {activeAddons.map((addon: any) => {
              const isAd = addon.plan_type === "advertisement";
              return (
                <div
                  key={addon.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 ${
                    isAd
                      ? "border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-card"
                      : "border-purple-500/40 bg-gradient-to-b from-purple-500/10 to-card"
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full mb-3 border ${
                        isAd
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      }`}
                    >
                      {isAd ? "⚡ 1-Week Flash Ad" : "🌟 Placement Add-on"}
                    </span>

                    <h3 className="text-base font-bold text-foreground mb-1">{addon.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{addon.tagline}</p>

                    <div className="mb-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold font-mono text-foreground">
                        {formatTierPrice(addon.price_pkr)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {addon.billing_period === "weekly" ? "7 days" : "month"}
                      </span>
                    </div>

                    <ul className="mb-6 space-y-2 text-xs">
                      {(addon.features || []).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <Check
                            className={`size-3.5 shrink-0 mt-0.5 ${
                              isAd ? "text-rose-400" : "text-purple-400"
                            }`}
                          />
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    asChild
                    className={`w-full font-bold rounded-xl border ${
                      isAd
                        ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-400/40"
                        : "bg-purple-600 hover:bg-purple-700 text-white border-purple-400/40"
                    }`}
                  >
                    <Link to="/auth" search={{ redirect: "/vendor/billing", mode: "signin" }}>
                      Attach {isAd ? "Ad Banner" : "Add-on"} <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Compare plans — side by side */}
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

        {/* Modern Interactive FAQ Section */}
        <PricingFAQSection />
      </section>

      <BottomNav />
    </div>
  );
}

function PricingFAQSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "faq-0": true, // First question open by default
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const FAQS = [
    {
      id: "faq-0",
      category: "plans",
      categoryLabel: "Plans & Billing",
      q: "I only sell visa & ticketing — do I need to pay for tour features?",
      a: "No. The Travel Desk plan (₨ 4,000/mo) is built exactly for specialized desks. You list visa, insurance, and ticket packages without paying for tour-only AI tools.",
    },
    {
      id: "faq-1",
      category: "plans",
      categoryLabel: "Plans & Billing",
      q: "I do both tours and visa/tickets — which plan is best?",
      a: "Go with Full Agency (₨ 12,000/mo). It is our complete suite that unlocks all four service categories in one unified vendor portal, plus 300 lead credits, unlimited AI tools, and featured search placement.",
    },
    {
      id: "faq-2",
      category: "leads",
      categoryLabel: "Leads & Conversion",
      q: "How do lead credits work?",
      a: "1 credit unlocks 1 customer contact (phone number, email, and WhatsApp inquiry) directly in your Leads Inbox. Unused monthly lead credits refresh every billing cycle.",
    },
    {
      id: "faq-3",
      category: "plans",
      categoryLabel: "Plans & Billing",
      q: "Can I switch, upgrade, or cancel anytime? What is the downgrade policy?",
      a: "Upgrades take effect immediately so you can unlock higher tier features right away. Downgrades take effect at the start of your next payment cycle, and no partial or prorated refunds are issued for the current active cycle. You retain 100% of your current plan features until your next billing date.",
    },
    {
      id: "faq-expiration",
      category: "plans",
      categoryLabel: "Plans & Billing",
      q: "How will I know when my plan is ending, and what happens if I don't renew?",
      a: "You will receive early warning alerts on your Vendor Portal header, WhatsApp, and email 7 days, 3 days, and 24 hours prior to expiration with a 1-click SafePay renewal link. If a plan expires, your account safely reverts to the Starter Free tier. Excess active tour listings above the Free tier limit (1 active listing) automatically pause (`is_active: false`). Zero Data Loss: All your tour drafts, itineraries, leads, and analytics are saved 100% securely and reactivate instantly upon renewal.",
    },
    {
      id: "faq-4",
      category: "ai",
      categoryLabel: "AI & Features",
      q: "What is the AI Trip Planner & Concierge integration?",
      a: "Our AI engine automatically crafts bilingual (English & Roman Urdu) itineraries, package descriptions, and highlights your agency in customer AI chat recommendations 24/7.",
    },
    {
      id: "faq-5",
      category: "leads",
      categoryLabel: "Leads & Conversion",
      q: "Do you charge any commission or transaction fees on bookings?",
      a: "Zero commission! GlobeTrek PK is a direct lead-generation marketplace. You keep 100% of your booking revenue and deal with clients directly.",
    },
    {
      id: "faq-6",
      category: "ai",
      categoryLabel: "AI & Features",
      q: "How do Marketplace Placement & Flash Banners work?",
      a: "Add-ons attach to active paid vendor accounts. Flash banners feature your agency on the main homepage hero for 7 days, while search placement boosts rank your listings at the top of universal search.",
    },
  ];

  const filteredFaqs = FAQS.filter((f) => {
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mt-16 border-t border-border pt-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <HelpCircle className="size-3.5" /> Frequently Asked Questions
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Got questions? We've got answers.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Everything you need to know about vendor plans, lead conversion, AI tools, and billing.
        </p>
      </div>

      {/* Controls: Search & Category Filters */}
      <div className="max-w-3xl mx-auto space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions (e.g. leads, AI, commission, visa)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs rounded-xl bg-card border-border shadow-xs focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "All Questions" },
            { id: "plans", label: "Plans & Billing" },
            { id: "ai", label: "AI & Features" },
            { id: "leads", label: "Leads & Revenue" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground border border-border hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Accordion Items */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-border bg-surface/20 text-muted-foreground text-xs">
            No questions matched your search query. Try searching another keyword!
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-primary/40 bg-gradient-to-b from-primary/5 via-card to-card shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex items-center rounded-md bg-surface border border-border/80 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                      {faq.categoryLabel}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                      {faq.q}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-surface/20 animate-in fade-in-50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA Card */}
      <div className="max-w-3xl mx-auto mt-10 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="text-left">
          <h4 className="text-sm font-bold text-foreground">Still have questions?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check our operating guide or ask our 24/7 AI Concierge anytime.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs rounded-xl border-border">
            <Link to="/vendor-guide">Read Vendor Guide</Link>
          </Button>
          <Button asChild size="sm" className="text-xs font-bold rounded-xl bg-primary text-primary-foreground">
            <Link to="/auth" search={{ mode: "signup", role: "vendor" }}>Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
