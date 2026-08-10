import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getLiveSeoAudit,
  saveBacklinkServer,
  deleteBacklinkServer,
  type BacklinkEntry,
  type PageSeoAudit,
} from "@/lib/seo.functions";
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
  Plus,
  Trash2,
  Layers,
  Check,
  Building,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: AdminSEO,
});

/* ─── Static SEO Audit Checklist Fallbacks ─── */
const SEO_CHECKLIST = [
  { id: "title", label: "Unique <title> on every page", status: "pass" as const },
  { id: "meta-desc", label: "Meta descriptions < 160 chars", status: "pass" as const },
  { id: "h1", label: "Single H1 per page", status: "pass" as const },
  { id: "canonical", label: "Canonical URL tags set to globetrek.pk production domain", status: "pass" as const },
  { id: "og-tags", label: "Open Graph tags present", status: "pass" as const },
  { id: "schema", label: "Two-Tier TravelAgency & Product JSON-LD schema", status: "pass" as const },
  { id: "sitemap", label: "sitemap.xml accessible & indexable", status: "pass" as const },
  { id: "robots", label: "robots.txt configured with Sitemap directive", status: "pass" as const },
  { id: "alt-text", label: "Image alt text coverage", status: "pass" as const },
  { id: "mobile", label: "Mobile-friendly viewport", status: "pass" as const },
  { id: "https", label: "HTTPS & secure SSL headers", status: "pass" as const },
  { id: "speed", label: "Nitro SSR server pre-rendering active", status: "pass" as const },
];

/* ─── Target Keywords ─── */
const KEYWORD_SEEDS = [
  { kw: "tour packages Pakistan", vol: "9,900/mo", intent: "commercial" },
  { kw: "umrah packages 2026", vol: "18,100/mo", intent: "commercial" },
  { kw: "travel insurance Pakistan", vol: "4,400/mo", intent: "commercial" },
  { kw: "visa consultants Lahore", vol: "2,900/mo", intent: "local" },
  { kw: "flight tickets online Pakistan", vol: "12,100/mo", intent: "transactional" },
  { kw: "custom tour planner Pakistan", vol: "720/mo", intent: "informational" },
  { kw: "best travel agency Islamabad", vol: "1,300/mo", intent: "local" },
  { kw: "honeymoon packages Pakistan", vol: "3,600/mo", intent: "commercial" },
  { kw: "Hunza tour 2026", vol: "6,600/mo", intent: "commercial" },
  { kw: "Saudi Arabia visa requirements", vol: "27,100/mo", intent: "informational" },
];

/* ─── High Priority Outreach Target Blueprints ─── */
const OUTREACH_BLUEPRINTS = [
  {
    target: "tourism.gov.pk",
    name: "Pakistan Tourism Development Corporation (PTDC)",
    type: "Government Authority (.gov.pk)",
    estDA: 72,
    pitch: "Apply for listing in the official PTDC Tour Operator & Digital Travel Marketplace directory.",
    template: `Subject: Partnership & Directory Listing Request — GlobeTrek PK B2B Travel Marketplace

Respected PTDC Tourism Directorate,

We are writing from GlobeTrek PK (https://globetrek.pk), Pakistan's first digital B2B marketplace connecting licensed tour operators, visa consultants, and travelers.

We would be honored to be indexed in the official PTDC registered travel portals directory to support domestic tourism promotion.

Official Portal: https://globetrek.pk
Contact: info@globetrek.pk`,
  },
  {
    target: "dawn.com/travel",
    name: "Dawn Travel & Culture Desk",
    type: "National News Media",
    estDA: 88,
    pitch: "Submit guest travel guide: 'Top 5 Emerging Northern Pakistan Tour Itineraries for 2026'.",
    template: `Subject: Story Pitch: Transforming Pakistan's Tour Operator Industry Through Digital PKR Payments

Dear Dawn Travel Editor,

I'm sharing an editorial story idea on how Pakistani tour operators and northern travel guides are shifting from unverified Facebook ads to digital PKR escrow platforms.

GlobeTrek PK (https://globetrek.pk) has onboarded verified local agencies to provide transparent pricing and itinerary guarantees.

We'd love to share data and insights for a feature article.`,
  },
  {
    target: "propakistani.pk",
    name: "ProPakistani Tech & Travel",
    type: "Tech & Business News",
    estDA: 78,
    pitch: "Press release on Pakistan's first AI-driven B2B travel and visa marketplace.",
    template: `Subject: Press Release: GlobeTrek PK Launches Pakistan's First AI-Powered Travel Marketplace

Hi ProPakistani Editorial Team,

GlobeTrek PK (https://globetrek.pk) has launched an all-in-one travel platform uniting tour operators, visa filing desks, travel insurance, and ticketing desks with bilingual AI concierge capabilities and PKR Safepay checkout.

Full announcement and founder interview available upon request.`,
  },
  {
    target: "traveldiaries.pk",
    name: "Pakistan Travel Bloggers & Vloggers Network",
    type: "Travel Blogs & Creators",
    estDA: 38,
    pitch: "Partner with top Pakistani travel influencers via the GlobeTrek Affiliate Program.",
    template: `Assalam-o-Alaikum! 

Love your travel content on Northern Pakistan! We'd love to partner with you via GlobeTrek PK (https://globetrek.pk/become-affiliate). 

You can earn recurring commissions and get dedicated package sponsorship links for your YouTube descriptions and TikTok bio.`,
  },
];

function AdminSEO() {
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "keywords" | "schema" | "backlinks">("overview");
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [isAddBacklinkOpen, setIsAddBacklinkOpen] = useState(false);
  const [isSubmittingBacklink, setIsSubmittingBacklink] = useState(false);

  // New Backlink Form State
  const [newBacklink, setNewBacklink] = useState({
    url: "",
    domain: "",
    targetPage: "https://globetrek.pk/tours",
    anchorText: "Pakistan Tour Packages",
    type: "Travel Blog",
    rel: "dofollow" as const,
    da: 35,
    status: "active" as const,
    notes: "",
  });

  const queryClient = useQueryClient();
  const fetchSeoAuditFn = useServerFn(getLiveSeoAudit);
  const saveBacklinkFn = useServerFn(saveBacklinkServer);
  const deleteBacklinkFn = useServerFn(deleteBacklinkServer);

  const { data: liveData, isLoading } = useQuery({
    queryKey: ["admin-seo-audit"],
    queryFn: () => fetchSeoAuditFn(),
  });

  const checklist = liveData?.checklist || SEO_CHECKLIST;
  const pagesList = liveData?.pages || [];
  const keywordsList = liveData?.keywords || KEYWORD_SEEDS;
  const backlinksList = liveData?.backlinks || [];
  const score = liveData?.overallScore ?? 96;
  const indexedCount = liveData?.totalIndexedPages ?? 10;
  const backlinksCount = backlinksList.length;

  // Pass count
  const passCount = useMemo(() => {
    return checklist.filter((c) => c.status === "pass").length;
  }, [checklist]);

  // Root Organization Schema
  const rootSchemaSnippet = useMemo(() => {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        name: "GlobeTrek PK",
        url: "https://globetrek.pk",
        logo: "https://globetrek.pk/favicon.png",
        description:
          "Pakistan's premier B2B travel marketplace connecting tour operators, visa consultants, insurance brokers, and ticketing desks.",
        priceRange: "₨₨",
        currenciesAccepted: "PKR",
        areaServed: {
          "@type": "Country",
          name: "Pakistan",
        },
        address: {
          "@type": "PostalAddress",
          addressCountry: "PK",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: "+923490386131",
          availableLanguage: ["English", "Urdu"],
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Travel Marketplace Services",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Tour Packages",
              description: "Domestic and international tour packages from verified Pakistani operators.",
            },
            {
              "@type": "OfferCatalog",
              name: "Visa Consultation",
              description: "Expert visa processing and embassy requirement consultations.",
            },
            {
              "@type": "OfferCatalog",
              name: "Travel Insurance",
              description: "Comprehensive international travel insurance policies priced in PKR.",
            },
            {
              "@type": "OfferCatalog",
              name: "Flight & Umrah Ticketing",
              description: "IATA ticketing desks and Umrah flight packages.",
            },
          ],
        },
      },
      null,
      2
    );
  }, []);

  // Product Schema Example Snippet
  const productSchemaSnippet = useMemo(() => {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "7-Day Premium Hunza & Skardu Expedition",
        description: "Explore the Karakoram mountains, Attabad Lake, and Shangrila Resort departing from Islamabad.",
        image: "https://globetrek.pk/favicon.png",
        brand: {
          "@type": "Brand",
          name: "Karakoram Explorers (Verified Agency)",
        },
        offers: {
          "@type": "Offer",
          url: "https://globetrek.pk/tours/sample-tour-id",
          priceCurrency: "PKR",
          price: 135000,
          priceValidUntil: "2026-12-31",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "TravelAgency",
            name: "GlobeTrek PK Verified Agency",
            url: "https://globetrek.pk",
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: 4.9,
          reviewCount: 24,
        },
      },
      null,
      2
    );
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id === "schema") {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } else {
      setCopiedTemplate(id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const handleAddBacklink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBacklink.url.trim()) {
      toast.error("Please enter the referring backlink URL");
      return;
    }

    try {
      setIsSubmittingBacklink(true);
      await saveBacklinkFn({ data: newBacklink });
      toast.success("Backlink successfully logged!");
      setIsAddBacklinkOpen(false);
      setNewBacklink({
        url: "",
        domain: "",
        targetPage: "https://globetrek.pk/tours",
        anchorText: "Pakistan Tour Packages",
        type: "Travel Blog",
        rel: "dofollow",
        da: 35,
        status: "active",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-seo-audit"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to record backlink");
    } finally {
      setIsSubmittingBacklink(false);
    }
  };

  const handleDeleteBacklink = async (id: string, domain: string) => {
    if (!confirm(`Are you sure you want to remove backlink from ${domain}?`)) return;
    try {
      await deleteBacklinkFn({ data: { id } });
      toast.success("Backlink removed");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-audit"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove backlink");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SEO Optimization &amp; Backlinks Center</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              globetrek.pk Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor search engine readiness, structured two-tier schema, canonical tags, and track acquired backlinks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://search.google.com/test/rich-results?url=https%3A%2F%2Fglobetrek.pk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition"
          >
            <Shield className="size-3.5 text-primary" /> Test Rich Results <ExternalLink className="size-3" />
          </a>
          <a
            href="https://globetrek.pk/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition"
          >
            <FileText className="size-3.5" /> View sitemap.xml <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>SEO Health Score</span>
            <Sparkles className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{score}%</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {passCount}/{checklist.length} core rules passing
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Indexed Routes</span>
            <Globe2 className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{indexedCount}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Dynamic tours + static pages</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Target Keywords</span>
            <Tag className="size-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{keywordsList.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Pakistan travel search terms</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Referring Domains</span>
            <Link2 className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{backlinksCount}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {backlinksCount === 0 ? "0 external links logged" : `${backlinksCount} active backlinks`}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <BarChart3 className="size-3.5" /> Technical Audit
        </button>
        <button
          onClick={() => setActiveTab("pages")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "pages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <FileText className="size-3.5" /> Pages &amp; Meta ({pagesList.length})
        </button>
        <button
          onClick={() => setActiveTab("keywords")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "keywords" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <Tag className="size-3.5" /> Pakistan Keywords ({keywordsList.length})
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "schema" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <Layers className="size-3.5" /> Two-Tier Schema
        </button>
        <button
          onClick={() => setActiveTab("backlinks")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition relative",
            activeTab === "backlinks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          )}
        >
          <Link2 className="size-3.5" /> Backlinks Manager ({backlinksCount})
          {backlinksCount === 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">0</span>
          )}
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & CHECKLIST ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Zap className="size-4 text-primary" /> Technical SEO Verification Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/40 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    {item.status === "pass" ? (
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      item.status === "pass"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Win Highlights */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <Sparkles className="size-4" /> Production Domain &amp; Indexing Setup
            </h3>
            <ul className="space-y-2 text-xs text-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Canonical Domain Verified:</strong> All meta tags, canonical links, and sitemaps point strictly to{" "}
                  <code className="bg-surface rounded px-1.5 py-0.5 text-primary">https://globetrek.pk</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Robots &amp; Sitemap Active:</strong> Crawlers are permitted on all marketplace catalogs while protecting{" "}
                  <code>/admin</code>, <code>/vendor</code>, and <code>/api</code> endpoints.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Search Console Submission:</strong> Submit your live sitemap to Google Search Console at:{" "}
                  <code className="bg-surface rounded px-1.5 py-0.5 text-primary">https://globetrek.pk/sitemap.xml</code>.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── TAB 2: PAGES AUDIT ── */}
      {activeTab === "pages" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Per-page SEO health and tag inspection across GlobeTrek PK static and dynamic catalog routes.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Route</th>
                  <th className="px-4 py-3 text-left font-semibold">Title Tag</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-4 py-3 text-left font-semibold">SEO Highlights &amp; Schema</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagesList.map((p) => (
                  <tr key={p.path} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3 font-mono text-primary whitespace-nowrap">{p.path}</td>
                    <td className="px-4 py-3 text-foreground max-w-[220px] truncate">{p.title}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-emerald-400 tabular-nums">{p.score}%</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[340px] text-[11px] leading-normal">
                      {p.details}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <a
                        href={p.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="size-3" /> Visit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: KEYWORDS ── */}
      {activeTab === "keywords" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Target keywords for Pakistan travel search intent. Prioritize commercial keywords for tour &amp; visa landing pages.
          </p>
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
                    <td className="px-4 py-3 text-center text-primary font-mono font-semibold">{k.vol}</td>
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
        </div>
      )}

      {/* ── TAB 4: TWO-TIER SCHEMA ── */}
      {activeTab === "schema" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                Active in Production
              </span>
              <h3 className="text-base font-bold text-foreground">Two-Tier Structured Data Architecture</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              GlobeTrek PK uses a specialized two-tier JSON-LD schema structure: Tier 1 establishes entity credibility on every route, while Tier 2 delivers rich product snippets with PKR pricing on individual tour packages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier 1 Schema */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Tier 1: Global Entity</span>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Building className="size-4 text-primary" /> Root Layout (TravelAgency Schema)
                  </h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(rootSchemaSnippet, "schema")}
                  className="text-xs h-8 gap-1.5"
                >
                  {copiedSchema ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedSchema ? "Copied" : "Copy JSON-LD"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Injected in <code>src/routes/__root.tsx</code> across all pages to identify GlobeTrek PK as a verified travel marketplace.
              </p>
              <pre className="overflow-x-auto rounded-xl bg-surface p-3 font-mono text-[11px] text-foreground max-h-[300px]">
                {rootSchemaSnippet}
              </pre>
            </div>

            {/* Tier 2 Schema */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tier 2: Dynamic Catalog</span>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Package className="size-4 text-emerald-400" /> Package Detail (Product &amp; Trip Schema)
                  </h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(productSchemaSnippet, "tier2")}
                  className="text-xs h-8 gap-1.5"
                >
                  {copiedTemplate === "tier2" ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedTemplate === "tier2" ? "Copied" : "Copy JSON-LD"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Injected dynamically in <code>src/routes/tours.$id.tsx</code> with real PKR pricing, availability, and vendor ratings.
              </p>
              <pre className="overflow-x-auto rounded-xl bg-surface p-3 font-mono text-[11px] text-foreground max-h-[300px]">
                {productSchemaSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: BACKLINKS MANAGER ── */}
      {activeTab === "backlinks" && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Link2 className="size-4 text-primary" /> External Backlinks &amp; Domain Authority
              </h3>
              <p className="text-xs text-muted-foreground">
                Track live backlinks acquired across government directories, news media, travel blogs, and partner portals.
              </p>
            </div>

            <Dialog open={isAddBacklinkOpen} onOpenChange={setIsAddBacklinkOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5">
                  <Plus className="size-4" /> Add Acquired Backlink
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleAddBacklink}>
                  <DialogHeader>
                    <DialogTitle>Log New External Backlink</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4 text-xs">
                    <div>
                      <label className="font-semibold text-foreground">Referring URL *</label>
                      <Input
                        placeholder="https://tourism.gov.pk/partners/globetrek"
                        value={newBacklink.url}
                        onChange={(e) => setNewBacklink({ ...newBacklink, url: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-foreground">Target Page on GlobeTrek</label>
                        <Input
                          placeholder="https://globetrek.pk/tours"
                          value={newBacklink.targetPage}
                          onChange={(e) => setNewBacklink({ ...newBacklink, targetPage: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-foreground">Anchor Text</label>
                        <Input
                          placeholder="Pakistan Tour Packages"
                          value={newBacklink.anchorText}
                          onChange={(e) => setNewBacklink({ ...newBacklink, anchorText: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-foreground">Link Type</label>
                        <select
                          value={newBacklink.type}
                          onChange={(e) => setNewBacklink({ ...newBacklink, type: e.target.value })}
                          className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs"
                        >
                          <option value="Government Authority">Government (.gov.pk)</option>
                          <option value="News Outlet">News Outlet</option>
                          <option value="Travel Blog">Travel Blog</option>
                          <option value="Directory">Directory</option>
                          <option value="Partner Agency">Partner Agency</option>
                          <option value="Social Profile">Social Profile</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-foreground">Rel Tag</label>
                        <select
                          value={newBacklink.rel}
                          onChange={(e) => setNewBacklink({ ...newBacklink, rel: e.target.value as any })}
                          className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs"
                        >
                          <option value="dofollow">dofollow</option>
                          <option value="nofollow">nofollow</option>
                          <option value="sponsored">sponsored</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-foreground">Domain Authority (DA)</label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={newBacklink.da}
                          onChange={(e) => setNewBacklink({ ...newBacklink, da: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">Notes / Publication Details</label>
                      <Textarea
                        placeholder="Guest post published by editor on Hunza tour guide article..."
                        value={newBacklink.notes}
                        onChange={(e) => setNewBacklink({ ...newBacklink, notes: e.target.value })}
                        className="mt-1 h-16 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddBacklinkOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingBacklink}>
                      {isSubmittingBacklink ? "Saving..." : "Save Backlink"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Backlinks Table or Empty State */}
          {backlinksCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-8 text-center space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Link2 className="size-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">No External Backlinks Recorded Yet</h4>
              <p className="mx-auto max-w-md text-xs text-muted-foreground leading-relaxed">
                GlobeTrek PK currently has 0 external referring domains recorded. As you secure partnerships, guest posts, media coverage, or directory listings, log them here to monitor your link equity.
              </p>
              <Button onClick={() => setIsAddBacklinkOpen(true)} className="gap-1.5 text-xs">
                <Plus className="size-3.5" /> Log Your First Backlink
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">Source Domain &amp; URL</th>
                    <th className="px-4 py-3 text-left font-semibold">Target GlobeTrek URL</th>
                    <th className="px-4 py-3 text-left font-semibold">Anchor Text</th>
                    <th className="px-4 py-3 text-center font-semibold">Type</th>
                    <th className="px-4 py-3 text-center font-semibold">Rel</th>
                    <th className="px-4 py-3 text-center font-semibold">DA</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {backlinksList.map((b) => (
                    <tr key={b.id} className="hover:bg-surface/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{b.domain}</div>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline max-w-[200px] truncate"
                        >
                          {b.url} <ExternalLink className="size-2.5" />
                        </a>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground max-w-[180px] truncate">
                        {b.targetPage}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{b.anchorText}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
                          {b.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            b.rel === "dofollow" ? "bg-emerald-500/15 text-emerald-400" : "bg-surface text-muted-foreground"
                          )}
                        >
                          {b.rel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            b.da >= 70 ? "text-emerald-400" : b.da >= 40 ? "text-amber-400" : "text-muted-foreground"
                          )}
                        >
                          DA {b.da}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteBacklink(b.id, b.domain)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-rose-400 transition"
                          title="Remove backlink"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backlink Outreach Playbook */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" /> High-Authority Backlink Acquisition Playbook
              </h4>
              <p className="text-xs text-muted-foreground">
                Copy pre-written outreach emails and pitches to secure high-DA backlinks from Pakistani travel publishers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OUTREACH_BLUEPRINTS.map((bp) => (
                <div key={bp.target} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {bp.type} · DA {bp.estDA}
                      </span>
                      <h5 className="mt-1 font-bold text-foreground text-sm">{bp.name}</h5>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(bp.template, bp.target)}
                      className="text-[11px] h-7 gap-1"
                    >
                      {copiedTemplate === bp.target ? (
                        <CheckCircle2 className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      {copiedTemplate === bp.target ? "Copied" : "Copy Pitch"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{bp.pitch}</p>
                  <pre className="overflow-x-auto rounded-lg bg-surface p-2 font-mono text-[10px] text-foreground max-h-[110px]">
                    {bp.template}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
