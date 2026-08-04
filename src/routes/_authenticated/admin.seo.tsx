import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveSeoAudit } from "@/lib/seo.functions";
import { toast } from "sonner";
import {
  Search,
  Globe2,
  TrendingUp,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Sparkles,
  BarChart3,
  Tag,
  Shield,
  Zap,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: AdminSEO,
});

/* ─── Static SEO Audit Checklist ─── */
const SEO_CHECKLIST = [
  { id: "title", label: "Unique <title> on every page", status: "pass" },
  { id: "meta-desc", label: "Meta descriptions < 160 chars", status: "pass" },
  { id: "h1", label: "Single H1 per page", status: "pass" },
  { id: "canonical", label: "Canonical URLs set", status: "pass" },
  { id: "og-tags", label: "Open Graph tags present", status: "pass" },
  { id: "schema", label: "TravelAgency schema.org JSON-LD", status: "pass" },
  { id: "sitemap", label: "sitemap.xml accessible", status: "warn" },
  { id: "robots", label: "robots.txt configured", status: "warn" },
  { id: "alt-text", label: "Image alt text coverage", status: "warn" },
  { id: "mobile", label: "Mobile-friendly viewport", status: "pass" },
  { id: "https", label: "HTTPS & secure headers", status: "pass" },
  { id: "speed", label: "Core Web Vitals target", status: "warn" },
];

/* ─── Target Keywords ─── */
const KEYWORD_SEEDS = [
  { kw: "tour packages Pakistan", vol: "9,900/mo", intent: "commercial" },
  { kw: "umrah packages 2025", vol: "18,100/mo", intent: "commercial" },
  { kw: "travel insurance Pakistan", vol: "4,400/mo", intent: "commercial" },
  { kw: "visa consultants Lahore", vol: "2,900/mo", intent: "local" },
  { kw: "flight tickets online Pakistan", vol: "12,100/mo", intent: "transactional" },
  { kw: "custom tour planner Pakistan", vol: "720/mo", intent: "informational" },
  { kw: "best travel agency Islamabad", vol: "1,300/mo", intent: "local" },
  { kw: "honeymoon packages Pakistan", vol: "3,600/mo", intent: "commercial" },
  { kw: "Hunza tour 2025", vol: "6,600/mo", intent: "commercial" },
  { kw: "Saudi Arabia visa requirements", vol: "27,100/mo", intent: "informational" },
];

/* ─── Pages SEO Summary ─── */
const PAGES = [
  { path: "/", title: "GlobeTrek PK — Discover Pakistan's Best Tours", score: 92, issues: 0 },
  { path: "/tours", title: "Tour Packages — GlobeTrek PK", score: 88, issues: 1 },
  { path: "/visa", title: "Visa Filing Services — GlobeTrek PK", score: 85, issues: 1 },
  { path: "/insurance", title: "Travel Insurance — GlobeTrek PK", score: 82, issues: 2 },
  { path: "/tickets", title: "Flight Tickets & Umrah Packages", score: 80, issues: 2 },
  { path: "/vendor-guide", title: "Vendor & Agency Operating Guide", score: 90, issues: 0 },
  { path: "/custom-tour", title: "Custom Tour Planner — GlobeTrek PK", score: 78, issues: 3 },
  { path: "/pricing", title: "Vendor Pricing Plans — GlobeTrek PK", score: 86, issues: 1 },
];

/* ─── Backlink Sources ─── */
const BACKLINKS = [
  { domain: "tourism.gov.pk", type: "Government", da: 72 },
  { domain: "traveldiaries.pk", type: "Blog", da: 34 },
  { domain: "packagestopakistan.com", type: "Competitor", da: 41 },
  { domain: "dawn.com/travel", type: "News", da: 88 },
  { domain: "geosuper.tv", type: "Media", da: 67 },
];

/* ─── Quick SEO Wins Mapping (Strict ID Matching) ─── */
const QUICK_WIN_ITEMS: Record<
  string,
  { id: string; label: string; render: (domain: string) => React.ReactNode }
> = {
  sitemap: {
    id: "sitemap",
    label: "Submit sitemap to Search Console",
    render: (domain) => (
      <>
        Submit sitemap to <strong>Google Search Console</strong> → Indexing → Sitemaps →{" "}
        <code className="bg-surface rounded px-1">{domain}/sitemap.xml</code>
      </>
    ),
  },
  robots: {
    id: "robots",
    label: "Configure robots.txt",
    render: () => (
      <>
        Add <strong>robots.txt</strong> allowing all bots except <code>/admin</code> and <code>/vendor</code>
      </>
    ),
  },
  "alt-text": {
    id: "alt-text",
    label: "Add image alt text",
    render: () => (
      <>
        Add descriptive <strong>alt text</strong> to all tour listing images in the CMS
      </>
    ),
  },
  speed: {
    id: "speed",
    label: "Bing Webmaster & Speed Target",
    render: () => (
      <>
        Register with <strong>Bing Webmaster Tools</strong> to capture 15–20% extra organic impressions
      </>
    ),
  },
};

/* ─── Recommended Outreach Strategies ─── */
const OUTREACH_RECOMMENDATIONS = [
  {
    domain: "tourism.gov.pk",
    render: () => (
      <>
        Submit your agency to <strong>Pakistan Tourism Development Corporation (PTDC)</strong> — high-authority .gov.pk link.
      </>
    ),
  },
  {
    domain: "dawn.com/travel",
    render: () => (
      <>
        Guest post on <strong>dawn.com/travel</strong> featuring "Top 5 Hunza Travel Tips" linking back to your tours page.
      </>
    ),
  },
  {
    domain: "travelbloggers.pk",
    render: () => (
      <>
        Partner with <strong>Pakistan travel bloggers</strong> for sponsored content with dofollow links.
      </>
    ),
  },
  {
    domain: "tripadvisor.com",
    render: () => (
      <>
        List on <strong>TripAdvisor, Google Business Profile</strong>, and <strong>Yelp Pakistan</strong> for local citations.
      </>
    ),
  },
];

/* ─── URL Normalization Helper ─── */
function normalizeDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  return rawUrl
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

/* ─── Component ─── */
function AdminSEO() {
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "keywords" | "schema" | "backlinks">("overview");
  const [domain, setDomain] = useState("https://globetrek.testbench.shop");
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [userSchemaJson, setUserSchemaJson] = useState<string | null>(null);

  // SSR-Safe domain resolution after initial mount (preverting hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setDomain(window.location.origin);
    }
  }, []);

  const fetchSeoAuditFn = useServerFn(getLiveSeoAudit);
  const { data: liveData } = useQuery({
    queryKey: ["admin-seo-audit"],
    queryFn: () => fetchSeoAuditFn(),
  });

  const checklist = liveData?.checklist || SEO_CHECKLIST;
  const pagesList = liveData?.pages || PAGES;
  const keywordsList = liveData?.keywords || KEYWORD_SEEDS;
  const backlinksList = liveData?.backlinks || BACKLINKS;
  const score = liveData?.overallScore ?? Math.round((checklist.filter((c) => c.status === "pass").length / checklist.length) * 100);
  const indexedCount = liveData?.totalIndexedPages ?? 24;

  // Memoized aggregations
  const totalPageIssues = useMemo(() => {
    return pagesList.reduce((sum, page) => sum + (page.issues || 0), 0);
  }, [pagesList]);

  const passCount = useMemo(() => {
    return checklist.filter((c) => c.status === "pass").length;
  }, [checklist]);

  // Dynamic Schema JSON matching current environment's domain
  const generatedSchemaJson = useMemo(() => {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "GlobeTrek PK",
        "url": domain,
        "logo": `${domain}/logo.png`,
        "description": "Pakistan's premier B2B travel marketplace connecting tour operators, visa consultants, insurance brokers, and ticketing desks.",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "PK",
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": ["English", "Urdu"],
        },
        "sameAs": [
          "https://www.facebook.com/globetrekpk",
          "https://twitter.com/globetrekpk",
        ],
      },
      null,
      2
    );
  }, [domain]);

  const activeSchemaJson = userSchemaJson ?? generatedSchemaJson;

  // Conditional Quick SEO Wins based on strict checklist rule ID matching
  const activeQuickWins = useMemo(() => {
    return checklist
      .filter((c) => (c.status === "warn" || c.status === "fail") && QUICK_WIN_ITEMS[c.id])
      .map((c) => QUICK_WIN_ITEMS[c.id]);
  }, [checklist]);

  // Backlink strategy recommendations filtered by acquired domains (using URL normalization)
  const acquiredDomainsSet = useMemo(() => {
    const set = new Set<string>();
    backlinksList.forEach((b) => {
      const norm = normalizeDomain(b.domain);
      if (norm) set.add(norm);
    });
    return set;
  }, [backlinksList]);

  const pendingOutreachRecommendations = useMemo(() => {
    return OUTREACH_RECOMMENDATIONS.filter((item) => {
      const targetNorm = normalizeDomain(item.domain);
      return !acquiredDomainsSet.has(targetNorm);
    });
  }, [acquiredDomainsSet]);

  function copySchema() {
    navigator.clipboard.writeText(activeSchemaJson);
    setCopiedSchema(true);
    toast.success("Schema JSON copied to clipboard!");
    setTimeout(() => setCopiedSchema(false), 2000);
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "pages", label: "Page Audit", icon: FileText },
    { id: "keywords", label: "Keywords", icon: Tag },
    { id: "schema", label: "Structured Data", icon: Shield },
    { id: "backlinks", label: "Backlinks", icon: Link2 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Search className="size-5 text-primary" />
            SEO Optimization Center
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and improve GlobeTrek PK's search engine presence
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <ExternalLink className="size-3.5" />
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
              Search Console
            </a>
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <ExternalLink className="size-3.5" />
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
              GA4
            </a>
          </Button>
        </div>
      </div>

      {/* Score Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "text-5xl font-black tabular-nums",
              score >= 90 ? "text-emerald-400" : score >= 75 ? "text-amber-400" : "text-red-400"
            )}
          >
            {score}
          </div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">SEO Health Score</div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            {passCount} passed · {totalPageIssues} warnings
          </div>
        </div>
        {[
          { label: "Indexed Pages", value: String(indexedCount), icon: Globe2, color: "text-primary" },
          { label: "Target Keywords", value: String(keywordsList.length), icon: Tag, color: "text-violet-400" },
          { label: "Referring Domains", value: String(backlinksList.length), icon: Link2, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <stat.icon className={cn("size-5 mb-3", stat.color)} />
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-full overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Technical SEO Audit Checklist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                  item.status === "pass"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-amber-500/20 bg-amber-500/5"
                )}
              >
                {item.status === "pass" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-amber-400" />
                )}
                <span className="text-foreground font-medium text-xs">{item.label}</span>
                <span
                  className={cn(
                    "ml-auto text-[10px] font-bold uppercase rounded-full px-2 py-0.5",
                    item.status === "pass"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  )}
                >
                  {item.status === "pass" ? "PASS" : "WARN"}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Wins (Conditional rendering based on strict checklist warning rule ID matching) */}
          {activeQuickWins.length > 0 ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 mt-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
                <Zap className="size-4" /> Quick SEO Wins ({activeQuickWins.length} Actionable Items)
              </h4>
              <ul className="space-y-2 text-xs text-foreground">
                {activeQuickWins.map((win) => (
                  <li key={win.id} className="flex items-start gap-2">
                    <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                    <span>{win.render(domain)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 mt-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" /> All Technical Audit Items Passed
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                No active warnings found in technical checklist audit.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "pages" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Per-page SEO score — higher is better. Fix issues to improve ranking.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Page</th>
                  <th className="px-4 py-3 text-left font-semibold">Title Tag</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-4 py-3 text-center font-semibold">Issues</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagesList.map((p) => (
                  <tr key={p.path} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3 font-mono text-primary">{p.path}</td>
                    <td className="px-4 py-3 text-foreground max-w-[240px] truncate">{p.title}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "font-bold",
                          p.score >= 90 ? "text-emerald-400" : p.score >= 80 ? "text-amber-400" : "text-red-400"
                        )}
                      >
                        {p.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.issues === 0 ? (
                        <CheckCircle2 className="size-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <AlertCircle className="size-3.5" />
                          {p.issues}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={p.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" /> View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "keywords" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Target keywords for Pakistan travel niche. Prioritize high-volume commercial keywords for tour & visa pages.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Keyword</th>
                  <th className="px-4 py-3 text-center font-semibold">Search Volume</th>
                  <th className="px-4 py-3 text-center font-semibold">Intent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keywordsList.map((k, i) => (
                  <tr key={k.kw} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{k.kw}</td>
                    <td className="px-4 py-3 text-center text-primary font-mono">{k.vol}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          k.intent.toLowerCase() === "commercial"
                            ? "bg-primary/15 text-primary"
                            : k.intent.toLowerCase() === "transactional"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : k.intent.toLowerCase() === "local"
                            ? "bg-violet-500/15 text-violet-400"
                            : "bg-surface text-muted-foreground"
                        )}
                      >
                        {k.intent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground space-y-1">
            <p className="font-semibold text-primary flex items-center gap-1.5"><Sparkles className="size-3.5" /> Keyword Strategy Tips</p>
            <p>• Use <strong>"Hunza tour 2025"</strong> as the primary H1 on the tours listing page — 6.6K monthly searches.</p>
            <p>• Create a dedicated <strong>Umrah Packages</strong> landing page — 18K monthly searches is your biggest opportunity.</p>
            <p>• Target <strong>"visa consultants [city]"</strong> with individual city landing pages for local SEO.</p>
            <p>• Publish blog content targeting <strong>"Saudi Arabia visa requirements"</strong> — 27K/mo informational traffic feeds the visa funnel.</p>
          </div>
        </div>
      )}

      {activeTab === "schema" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Copy the structured data (JSON-LD) below and embed it in the <code>&lt;head&gt;</code> of your homepage via the{" "}
            <strong>Landing Page CMS</strong>. This helps Google show rich results.
          </p>
          <div className="relative">
            <Textarea
              className="font-mono text-xs min-h-[340px] rounded-xl bg-surface"
              value={activeSchemaJson}
              onChange={(e) => setUserSchemaJson(e.target.value)}
            />
            <button
              onClick={copySchema}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition"
            >
              {copiedSchema ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              {copiedSchema ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2 text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5"><Info className="size-3.5 text-primary" /> How to apply</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the JSON-LD above.</li>
              <li>Go to <strong>CMS Engine → Landing Page CMS</strong>.</li>
              <li>Paste it inside a <code>&lt;script type="application/ld+json"&gt;</code> tag in the page <code>&lt;head&gt;</code> section.</li>
              <li>Test with <a className="text-primary underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Google Rich Results Test</a>.</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === "backlinks" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Referring domains linking to GlobeTrek PK. Focus outreach on high-DA government and media sites.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Domain</th>
                  <th className="px-4 py-3 text-center font-semibold">Type</th>
                  <th className="px-4 py-3 text-center font-semibold">Domain Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backlinksList.map((b) => (
                  <tr key={b.domain} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3 font-mono text-primary">{b.domain}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold tabular-nums", b.da >= 70 ? "text-emerald-400" : b.da >= 40 ? "text-amber-400" : "text-muted-foreground")}>
                        DA {b.da}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Backlink Outreach Strategy (Filtered by acquired domains normalized set) */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground space-y-2">
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> Backlink Acquisition Strategy
            </p>
            {pendingOutreachRecommendations.length > 0 ? (
              <ul className="space-y-1">
                {pendingOutreachRecommendations.map((item) => (
                  <li key={item.domain} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{item.render()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                All priority outreach targets have already been acquired!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
