import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { fetchVendorGuideSections, VendorGuideSection, FALLBACK_VENDOR_GUIDE_SECTIONS } from "@/lib/vendor-guide.functions";
import { askVendorGuideAIServer } from "@/lib/guide-ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  Search,
  Printer,
  Download,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  Users,
  Building2,
  Wallet,
  Compass,
  Edit3,
  Calculator,
  Sparkles,
  Send,
  Loader2,
  Bot,
  HelpCircle,
  ChevronDown,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor-guide")({
  component: VendorGuidePage,
  head: () => ({
    meta: [
      { title: "GlobeTrek PK — Vendor & Agency Operating Guide" },
      {
        name: "description",
        content:
          "Official partner operating guide for tour operators, visa consultants, insurance brokers, and ticketing desks on GlobeTrek PK. Onboarding, KYC, custom tour & visa lead bidding, SafePay payouts, AI tools, and ROI calculator.",
      },
    ],
  }),
});

const ICON_MAP: Record<string, any> = {
  UserCheck,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Building2,
  Wallet,
  Compass,
  BookOpen,
  FileCheck,
};

const SUGGESTED_AI_PROMPTS = [
  "Cover image par phone number ya WhatsApp daalne par listing block kyun hoti hai?",
  "Qwen-VL Visual Contact Shield image upload hone se pehle kya check karta hai?",
  "Custom Visa Leads unlock karne ki fee kitni hai (₨ 750) aur max kitne vendors unlock kar sakte hain?",
  "Refusal case visa leads mein applicant ki rejection details kaise milti hain?",
  "Gerry's aur VFS drop-box submission center leads par local client match badge kaise milta hai?",
  "Interactive OpenStreetMap placement tour packages par kaise milti hai?",
  "WhatsApp lead alerts mein traveler phone number obfuscated kyun hota hai?",
  "Pro Tour Operator plan mein OpenStreetMap placement ke kya fayde hain?",
  "Plan expiry notice kaise milta hai aur non-renewal par kya hoga?",
  "What happens to my tour listings if my subscription plan expires?",
  "What documents are required for vendor KYC verification?",
  "How does the Max 5 lead unlock cap work for custom visa leads?",
  "SafePay payment lead unlock procedure kitna time leta hai?",
  "How can I generate AI itineraries for my tour packages?",
  "Pro plan mein kitne AI itinerary plans milte hain per month?",
  "Starter aur Pro plan mein kya fark hai AI tools ke liye?",
];

// ---- Rich Markdown Renderer Components ----
const mdComponents: import("react-markdown").Components = {
  h1: ({ children }) => (
    <h1 className="text-xl sm:text-2xl font-extrabold text-primary border-b border-primary/30 pb-2 mb-4 mt-6 tracking-tight flex items-center gap-2">
      <span className="inline-block w-1 h-6 rounded-full bg-primary shrink-0" />
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base sm:text-lg font-bold text-purple-400 border-l-4 border-purple-500/60 pl-3 py-0.5 mt-7 mb-3 bg-purple-500/5 rounded-r-xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-amber-400 mt-5 mb-2 flex items-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-extrabold uppercase tracking-widest text-sky-400 mt-4 mb-1">
      {children}
    </h4>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-amber-500/60 bg-amber-500/8 rounded-r-xl px-4 py-3 my-4 text-xs text-amber-200 italic space-y-1">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <code className={`block bg-surface border border-border rounded-xl p-3 font-mono text-[11px] text-primary overflow-x-auto my-3 ${className ?? ""}`}>
        {children}
      </code>
    ) : (
      <code className="bg-surface border border-border/60 rounded px-1.5 py-0.5 font-mono text-[11px] text-primary">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-xl border border-border my-4 shadow-sm">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface/80 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border/60">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-surface/40 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="p-3 text-left font-bold tracking-wider">{children}</th>
  ),
  td: ({ children }) => (
    <td className="p-3 text-foreground">{children}</td>
  ),
  hr: () => (
    <hr className="border-none h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-3 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 my-3 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
      <span className="mt-1.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  p: ({ children }) => (
    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed my-2">{children}</p>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;
    return (
      <div className="my-5 overflow-hidden rounded-2xl border border-border bg-surface/40 shadow-sm transition-all hover:border-primary/40">
        <img
          src={src}
          alt={alt || "Guide Screenshot"}
          className="w-full max-h-[460px] object-cover rounded-2xl"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("/images/guide/landing-page.png")) {
              target.src = "/images/guide/landing-page.png?v=fallback";
            }
          }}
        />
        {alt && (
          <div className="border-t border-border/60 bg-card/60 px-4 py-2 text-[11px] text-muted-foreground italic flex items-center justify-between">
            <span>📷 {alt}</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">GlobeTrek PK Platform</span>
          </div>
        )}
      </div>
    );
  },
};

// Ordered list items need their own marker, override li for ol context via parent
const mdComponentsAI: import("react-markdown").Components = {
  ...mdComponents,
  h1: ({ children }) => (
    <h1 className="text-base font-extrabold text-primary border-b border-primary/30 pb-1.5 mb-3 mt-4 tracking-tight flex items-center gap-2">
      <span className="inline-block w-1 h-4 rounded-full bg-primary shrink-0" />
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-purple-400 border-l-3 border-purple-500/60 pl-2.5 mt-4 mb-2 bg-purple-500/5 rounded-r-lg py-0.5">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-bold text-amber-400 mt-3 mb-1 flex items-center gap-1.5">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      {children}
    </h3>
  ),
};

function VendorGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeSlug, setActiveSlug] = useState<string>("vendor-onboarding-kyc");

  // AI Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Calculator State for Lead ROI Simulator
  const [monthlyLeadsCount, setMonthlyLeadsCount] = useState<number>(10);
  const [avgPackagePricePKR, setAvgPackagePricePKR] = useState<number>(350000);
  const [conversionRatePercent, setConversionRatePercent] = useState<number>(30); // 30% closing rate
  const leadUnlockFeePKR = 5000;

  // Fetch sections
  const { data: sections = FALLBACK_VENDOR_GUIDE_SECTIONS, isLoading } = useQuery({
    queryKey: ["vendor-guide-sections"],
    queryFn: () => fetchVendorGuideSections(),
    initialData: FALLBACK_VENDOR_GUIDE_SECTIONS,
  });

  // Check if current user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      return !!data;
    },
  });

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => set.add(s.category));
    return ["All", ...Array.from(set)];
  }, [sections]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchesSearch =
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [sections, selectedCategory, searchTerm]);

  // Active section
  const activeSection = useMemo(() => {
    return sections.find((s) => s.slug === activeSlug) || sections[0];
  }, [sections, activeSlug]);

  // Handle Ask AI Assistant
  const handleAskAI = async (queryText?: string) => {
    const q = (queryText || aiQuestion).trim();
    if (!q) return;

    setIsAskingAI(true);
    setAiQuestion(q);

    try {
      const res = await askVendorGuideAIServer({ data: { question: q } });
      setAiAnswer(res.answer);
      toast.success("AI Partner Assistant answered your query!");
    } catch (err: any) {
      toast.error(`AI Assistant error: ${err.message}`);
    } finally {
      setIsAskingAI(false);
    }
  };

  // Real-time Dynamic PDF Download Handler (Generated from Live Supabase CMS Data)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Download Executive Vendor Manual PDF
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    const toastId = toast.loading("Downloading GlobeTrek Vendor Operating Manual PDF...");
    try {
      const link = document.createElement("a");
      link.href = "/vendor-agency-manual.pdf";
      link.download = "GlobeTrek-Vendor-Operating-Manual-2026.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Executive Vendor Operating Manual downloaded!", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to download PDF", { id: toastId });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Handle Browser PDF Print
  const handlePrintPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Lead ROI Math
  const totalUnlockCostPKR = monthlyLeadsCount * leadUnlockFeePKR;
  const expectedClosedDeals = Math.round((monthlyLeadsCount * conversionRatePercent) / 100);
  const grossMonthlyRevenuePKR = expectedClosedDeals * avgPackagePricePKR;
  const estimatedProfitMarginPKR = grossMonthlyRevenuePKR * 0.15 - totalUnlockCostPKR; // Assuming 15% agency margin

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col print:bg-white print:text-slate-900">
      {/* Print-Only Executive Header */}
      <div className="hidden print:block text-left border-b-2 border-emerald-700 pb-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-black text-emerald-800">GlobeTrek PK</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Official Partner Manual · 2026 Edition</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Vendor &amp; Agency Operating Manual</h1>
        <p className="text-xs text-slate-600">Official Operational &amp; Commercial Standards for Pakistani Tour Operators, Visa Desks &amp; Travel Agencies</p>
        <p className="text-[10px] text-slate-400 mt-1">Exported from https://globetrek.pk/vendor-guide · Confidential</p>
      </div>

      {/* Screen Navigation Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
              <span className="text-primary font-black text-2xl">GlobeTrek</span>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">PK</span>
            </Link>
            <Badge variant="outline" className="hidden md:inline-flex border-amber-500/30 text-amber-400 font-semibold">
              Vendor Operating Manual
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isDownloadingPDF ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Download PDF
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintPDF}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Printer className="size-3.5 text-muted-foreground" /> Print
            </Button>

            {isAdmin && (
              <Link to="/admin/vendor-guide">
                <Button size="sm" className="h-9 gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black">
                  <Edit3 className="size-3.5" /> CMS Admin Editor
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="border-b bg-surface/50 py-10 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" /> Master Partner Operating Documentation &amp; AI Assistant
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                GlobeTrek PK Vendor Operating Guide
              </h1>
              <p className="text-sm text-muted-foreground">
                Detailed step-by-step procedures for partner onboarding, KYC compliance, custom lead bidding, SafePay payouts, and built-in OpenRouter AI tools.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search guide topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs rounded-xl bg-card border-border"
              />
            </div>
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs rounded-xl h-8 font-semibold"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Body: Sidebar Navigation + Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Table of Contents */}
        {/* Left Sidebar Table of Contents & AI Assistant */}
        <aside className="lg:col-span-4 space-y-6 print:hidden">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Guide Chapters ({filteredSections.length})
              </h3>

              <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const IconComp = ICON_MAP[sec.icon_name] || BookOpen;
                  const isActive = sec.slug === activeSlug;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSlug(sec.slug)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-3 border ${
                        isActive
                          ? "border-primary bg-primary/10 font-bold text-foreground shadow-sm"
                          : "border-transparent hover:bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <IconComp className={`size-4 shrink-0 mt-0.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="space-y-0.5 overflow-hidden">
                        <p className="truncate font-semibold text-foreground">{sec.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{sec.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Sidebar AI Partner Assistant */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card p-4 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Bot className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      AI Partner Assistant
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0">
                        AI
                      </Badge>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Operational Q&amp;A (English &amp; Urdu)
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`size-4 text-purple-400 transition-transform duration-200 shrink-0 ${
                    showAiAssistant ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAiAssistant && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="size-3 text-purple-400" /> Quick Prompts:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_AI_PROMPTS.slice(0, 4).map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAskAI(promptText)}
                          className="text-[10px] text-left rounded-lg bg-surface/80 hover:bg-purple-500/20 border border-border/80 text-foreground px-2 py-1 transition-all"
                        >
                          💡 {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Ask Operational Q&A..."
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                      className="text-xs rounded-xl bg-card border-border flex-1 h-8"
                    />
                    <Button
                      onClick={() => handleAskAI()}
                      disabled={isAskingAI || !aiQuestion.trim()}
                      className="h-8 gap-1 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3"
                    >
                      {isAskingAI ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                    </Button>
                  </div>

                  {aiAnswer && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-1.5 text-xs leading-relaxed max-h-60 overflow-y-auto">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300 text-[11px]">
                        <Sparkles className="size-3" /> Answer:
                      </div>
                      <div className="prose prose-xs dark:prose-invert max-w-none text-[11px]">
                        <ReactMarkdown components={mdComponentsAI}>{aiAnswer}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Link Card to ROI Simulator */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Calculator className="size-4" /> Lead ROI Calculator Below
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Simulate monthly earnings and return on investment from unlocked custom leads.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <section className="lg:col-span-8 space-y-8">

          {/* Main Active Chapter Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground print:hidden">
              <div className="animate-spin mr-2 size-5 border-2 border-primary border-t-transparent rounded-full" />
              Loading chapter documentation...
            </div>
          ) : activeSection ? (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-6 print:hidden">
              {/* Chapter Header */}
              <div className="border-b border-border pb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-primary/30 text-primary">
                    {activeSection.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Chapter #{activeSection.display_order}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {activeSection.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {activeSection.description}
                </p>
              </div>

              {/* Rendered Markdown Content */}
              <div className="max-w-none space-y-1">
                <ReactMarkdown components={mdComponents}>{activeSection.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground print:hidden">
              No matching guide chapter found. Please adjust your search query.
            </div>
          )}

          {/* Print-Only: All Chapters Rendered Sequentially for Complete PDF Document */}
          <div className="hidden print:block space-y-10">
            {sections.map((sec) => (
              <div key={sec.id} className="border-b pb-8 space-y-4 page-break-after-always">
                <div className="border-b pb-3">
                  <span className="text-xs font-bold uppercase text-gray-500">{sec.category} · Chapter #{sec.display_order}</span>
                  <h2 className="text-xl font-bold text-black mt-1">{sec.title}</h2>
                  <p className="text-xs text-gray-600 font-medium">{sec.description}</p>
                </div>
                <div className="prose prose-sm text-black max-w-none">
                  <ReactMarkdown components={mdComponents}>{sec.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Lead ROI & Revenue Simulator */}
          <div className="rounded-3xl border border-amber-500/40 bg-card p-6 sm:p-8 shadow-card space-y-6 print:hidden">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="size-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Calculator className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Vendor Lead ROI &amp; Profit Simulator</h3>
                <p className="text-xs text-muted-foreground">
                  Calculate your projected monthly revenue and net profit when bidding on verified custom tour leads.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Monthly Leads Unlocked: <strong className="text-amber-400 font-mono">{monthlyLeadsCount}</strong>
                </label>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[monthlyLeadsCount]}
                  onValueChange={(v) => setMonthlyLeadsCount(v[0])}
                />
                <p className="text-[10px] text-muted-foreground">Unlock fee: ₨ 5,000 / lead</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Avg Package Value: <strong className="text-amber-400 font-mono">Rs {avgPackagePricePKR.toLocaleString()} PKR</strong>
                </label>
                <Slider
                  min={100000}
                  max={1500000}
                  step={50000}
                  value={[avgPackagePricePKR]}
                  onValueChange={(v) => setAvgPackagePricePKR(v[0])}
                />
                <p className="text-[10px] text-muted-foreground">Average booking total</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Estimated Close Rate: <strong className="text-amber-400 font-mono">{conversionRatePercent}%</strong>
                </label>
                <Slider
                  min={10}
                  max={80}
                  step={5}
                  value={[conversionRatePercent]}
                  onValueChange={(v) => setConversionRatePercent(v[0])}
                />
                <p className="text-[10px] text-muted-foreground">Expected booking conversion</p>
              </div>
            </div>

            {/* Math Outputs */}
            <div className="grid gap-4 sm:grid-cols-4 bg-surface/60 p-4 rounded-2xl border border-border/60 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Total Unlock Investment</span>
                <span className="text-base font-extrabold text-foreground font-mono">Rs {totalUnlockCostPKR.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Expected Closed Tours</span>
                <span className="text-base font-extrabold text-foreground font-mono">{expectedClosedDeals} Packages</span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Gross Package Bookings</span>
                <span className="text-base font-extrabold text-primary font-mono">Rs {grossMonthlyRevenuePKR.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Est. Net Profit Margin</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">Rs {estimatedProfitMarginPKR > 0 ? estimatedProfitMarginPKR.toLocaleString() : 0}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
