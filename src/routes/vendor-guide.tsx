import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { fetchVendorGuideSections, VendorGuideSection } from "@/lib/vendor-guide.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/vendor-guide")({
  component: VendorGuidePage,
  head: () => ({
    meta: [
      { title: "GlobeTrek PK — Vendor & Agency Operating Guide" },
      {
        name: "description",
        content:
          "Official partner operating guide for tour operators, visa consultants, insurance brokers, and ticketing desks on GlobeTrek PK. Onboarding, KYC, custom lead bidding, SafePay payouts, and ROI calculator.",
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
};

function VendorGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeSlug, setActiveSlug] = useState<string>("vendor-onboarding-kyc");

  // Calculator State for Lead ROI Simulator
  const [monthlyLeadsCount, setMonthlyLeadsCount] = useState<number>(10);
  const [avgPackagePricePKR, setAvgPackagePricePKR] = useState<number>(350000);
  const [conversionRatePercent, setConversionRatePercent] = useState<number>(30); // 30% closing rate
  const leadUnlockFeePKR = 5000;

  // Fetch sections
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["vendor-guide-sections"],
    queryFn: fetchVendorGuideSections,
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

  // Handle PDF Print
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Print-Only Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold">GlobeTrek PK — Partner Operating Guide</h1>
        <p className="text-sm text-gray-600">Official Master Documentation for Tour Operators, Visa Desks &amp; Travel Agencies</p>
        <p className="text-xs text-gray-500 mt-1">Exported on {new Date().toLocaleDateString()} — https://tour.testbench.shop/vendor-guide</p>
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

          <div className="flex items-center gap-3">
            <a
              href="/vendor-guide.pdf"
              download="GlobeTrek-Vendor-Operating-Guide.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs font-semibold">
                <Download className="size-3.5 text-primary" /> Download PDF
              </Button>
            </a>

            <Button size="sm" variant="outline" onClick={handlePrintPDF} className="h-9 gap-1.5 text-xs font-semibold">
              <Printer className="size-3.5" /> Print
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
                <Sparkles className="size-3.5" /> Master Partner Operating Documentation
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                GlobeTrek PK Vendor Operating Guide
              </h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about registration, KYC verification, bidding on verified custom tour leads, submitting online quotations, and SafePay payouts.
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
                className="text-xs rounded-xl h-8"
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
        <aside className="lg:col-span-4 space-y-4 print:hidden">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Guide Chapters ({filteredSections.length})
              </h3>

              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
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
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <div className="animate-spin mr-2 size-5 border-2 border-primary border-t-transparent rounded-full" />
              Loading chapter documentation...
            </div>
          ) : activeSection ? (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-6">
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
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {activeSection.description}
                </p>
              </div>

              {/* Rendered Markdown Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                <ReactMarkdown>{activeSection.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No matching guide chapter found. Please adjust your search query.
            </div>
          )}

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
