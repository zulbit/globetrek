import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { generateEnterpriseDemoAIServer, DemoItineraryStructure } from "@/lib/guide-ai.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ShieldCheck,
  Building2,
  Sparkles,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Briefcase,
  Maximize2,
  Zap,
  MessageSquare,
  BarChart3,
  Search,
  Globe2,
  Compass,
  CreditCard,
  FileCheck,
  Ticket,
  BookOpen,
  Bot,
  Loader2,
  Wand2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/enterprise")({
  component: EnterpriseShowcase,
  head: () => ({
    meta: [
      { title: "GlobeTrek PK — Enterprise B2B Travel Marketplace Engine Whitepaper" },
      {
        name: "description",
        content:
          "Enterprise B2B travel marketplace architecture. Full SSR stack with TanStack Start, React 19, Supabase RLS, SafePay PKR payments, WhatsApp API, and GlobeTrek AI Engine.",
      },
    ],
  }),
});

const SCREENSHOTS = [
  {
    src: "/images/guide/auth-page.png",
    title: "Partner Sign-Up & Authentication Portal",
    caption: "Role-based authentication with email and phone credentials protected by Supabase security definer RLS.",
  },
  {
    src: "/images/guide/landing-page.png",
    title: "Marketplace Landing Page & Search Engine",
    caption: "Universal marketplace search across Tours, Visa, Insurance, and Flight/Umrah tickets with AI Chat trigger.",
  },
  {
    src: "/images/guide/vendor-dashboard.png",
    title: "Vendor Operations Console & Analytics",
    caption: "30-Day service-filtered lead activity line chart, quick stats, custom lead teaser, and inbox.",
  },
  {
    src: "/images/guide/vendor-leads-marketplace.png",
    title: "Custom Lead Bidding & Online Quotation Dialog",
    caption: "Verified custom lead bidding with Max 3 unlock limits, safe payment unlocks, and online proposal builder.",
  },
  {
    src: "/images/guide/vendor-guide-page.png",
    title: "Vendor Operating Guide & ROI Simulator",
    caption: "Master operating manual with category search, markdown chapters, print-to-PDF, and ROI calculator.",
  },
  {
    src: "/images/whitepaper/enterprise-page.png",
    title: "Enterprise Platform Governance & Architecture",
    caption: "Full tech stack breakdown, SafePay PKR gateway, WhatsApp automated alerts, and audit logs.",
  },
];

const COMPARISON_DATA = [
  {
    feature: "Modern Edge SSR Stack (React 19 + TanStack Start)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Universal Marketplace Search (4 Services)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Custom Lead Bidding with Max 3 Unlock Cap",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "SafePay PKR Payment Gateway Integration",
    globetrek: true,
    cloneScript: false,
    saasPms: true,
    wordpress: false,
  },
  {
    feature: "Automated WhatsApp Alerts & Receipts",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Bilingual AI Concierge (English & Roman Urdu)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Traveler Online Quote Comparison Portal",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "100% Full Source Code & Database Ownership",
    globetrek: true,
    cloneScript: true,
    saasPms: false,
    wordpress: true,
  },
];

const FAQS = [
  {
    q: "Can GlobeTrek PK be customized for white-label enterprise deployment?",
    a: "Yes! GlobeTrek PK is built on modular architecture with 100% source code ownership. It can be white-labeled with custom logos, domains, regional currencies, and local payment gateways.",
  },
  {
    q: "How does the Bilingual AI Concierge work?",
    a: "The AI Concierge leverages GlobeTrek's neural language model via `@ai-sdk/openai-compatible`. It seamlessly handles travel inquiries in both English and Roman Urdu, querying live database tables for tours, visa services, insurance plans, and flight tickets.",
  },
  {
    q: "How does the Custom Lead Bidding & SafePay Integration operate?",
    a: "Custom lead submissions start in an unverified status. Admin calls to verify traveler budget before publishing. Vendors unlock contact details via SafePay PKR payment (capped at 3 vendors max), then submit online quotations which send automated WhatsApp alerts to the traveler.",
  },
];

function EnterpriseShowcase() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // AI Demo Generator State
  const [demoDestination, setDemoDestination] = useState("Hunza & Skardu Valley");
  const [demoDuration, setDemoDuration] = useState<number>(5);
  const [demoItinerary, setDemoItinerary] = useState<DemoItineraryStructure | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const handleGenerateAIDemo = async () => {
    if (!demoDestination.trim()) return;
    setIsGeneratingDemo(true);
    try {
      const res = await generateEnterpriseDemoAIServer({
        data: { destination: demoDestination, duration_days: demoDuration },
      });
      setDemoItinerary(res.itinerary);
      toast.success("Generated AI Itinerary!");
    } catch (err: any) {
      toast.error(`AI Demo error: ${err.message}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="text-primary font-black text-2xl">GlobeTrek</span>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">PK</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/vendor-guide">
              <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs font-semibold">
                <BookOpen className="size-3.5 text-primary" /> Vendor Guide
              </Button>
            </Link>

            <Link to="/auth">
              <Button size="sm" className="h-9 gap-1.5 text-xs font-bold bg-primary text-black hover:bg-primary/90">
                Vendor Portal Sign Up <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border border-primary/30 font-bold px-3 py-1 text-xs">
            ⚡ Enterprise B2B Travel Marketplace &amp; AI Engine Stack
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            The Modern B2B Travel Marketplace Engine for Tour Operators &amp; Agencies
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            A high-performance Server-Side Rendered platform built with TanStack Start, React 19, Supabase RLS, SafePay Gateway, WhatsApp Automation, and GlobeTrek AI Engine.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link to="/vendor-guide">
              <Button size="lg" className="gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-glow">
                Explore Vendor Operating Manual <ArrowRight className="size-4" />
              </Button>
            </Link>

            <a href="mailto:enterprise@globetrek.pk" className="inline-flex">
              <Button size="lg" variant="outline" className="gap-2 font-semibold">
                Request Enterprise Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Interactive AI Itinerary Generator Demo Widget */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-card to-card p-6 sm:p-10 shadow-card space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-bold gap-1">
                <Wand2 className="size-3.5" /> GlobeTrek AI Engine Technology Demo
              </Badge>
              <h2 className="text-2xl font-extrabold text-foreground">
                GlobeTrek AI Tour Itinerary Generator
              </h2>
              <p className="text-xs text-muted-foreground">
                Experience how GlobeTrek's embedded AI engine creates instant, marketing-ready itineraries for tour vendors.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Destination Name</label>
              <Input
                placeholder="e.g. Hunza Valley, Skardu, Turkey"
                value={demoDestination}
                onChange={(e) => setDemoDestination(e.target.value)}
                className="text-xs rounded-xl bg-card border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Duration (Days)</label>
              <Input
                type="number"
                min={1}
                max={15}
                value={demoDuration}
                onChange={(e) => setDemoDuration(parseInt(e.target.value, 10) || 5)}
                className="text-xs rounded-xl bg-card border-border"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerateAIDemo}
                disabled={isGeneratingDemo || !demoDestination.trim()}
                className="w-full h-10 gap-2 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-glow"
              >
                {isGeneratingDemo ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Generate AI Itinerary Demo
              </Button>
            </div>
          </div>

          {/* Ultra-Professional Structured Itinerary Display */}
          {demoItinerary && (
            <div className="rounded-3xl border border-purple-500/40 bg-surface/90 p-6 sm:p-8 space-y-8 shadow-2xl animate-fade-in">
              {/* Header Badge & Title Card */}
              <div className="border-b border-border/80 pb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-extrabold uppercase tracking-wider px-3 py-1">
                    ✨ GlobeTrek AI Generated Tour Plan
                  </Badge>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1">
                      <MapPin className="size-3.5" /> {demoItinerary.destination}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1">
                      <Calendar className="size-3.5" /> {demoItinerary.duration_days} Days
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {demoItinerary.title}
                </h3>
              </div>

              {/* Highlights Cards Section */}
              {demoItinerary.highlights && demoItinerary.highlights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="size-4 text-purple-400" /> Package Key Highlights
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {demoItinerary.highlights.map((hl, hIdx) => (
                      <div
                        key={hIdx}
                        className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3 shadow-sm hover:border-purple-500/40 transition-all"
                      >
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground font-medium leading-relaxed">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day-by-Day Experience Timeline Cards */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4 text-purple-400" /> Day-by-Day Tour Experience
                </h4>

                <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
                  {demoItinerary.days.map((dayItem) => (
                    <div key={dayItem.day} className="relative pl-12 flex flex-col space-y-2">
                      {/* Circular Day Badge on Timeline */}
                      <div className="absolute left-0 top-0 size-10 rounded-full bg-purple-600 border-2 border-background text-white flex items-center justify-center font-black text-xs shadow-md">
                        {dayItem.day}
                      </div>

                      {/* Day Experience Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm hover:border-border-hover transition-all">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="font-bold text-sm text-foreground">
                            Day {dayItem.day}: {dayItem.title}
                          </h5>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border font-mono">
                            Full Day
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {dayItem.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Traveler Budget Callout Banner */}
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                    Recommended Traveler Budget
                  </span>
                  <span className="text-lg font-black text-foreground font-mono">
                    {demoItinerary.budget_pkr}
                  </span>
                </div>

                <Link to="/auth">
                  <Button size="sm" className="h-9 gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black">
                    Create Packages with AI <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Screenshot Showcase Gallery */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-bold">
            Live Interface Showcase
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inspected Platform Interfaces
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Clean, responsive UI design built with custom CSS design tokens, dynamic charts, and micro-animations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SCREENSHOTS.map((s, idx) => (
            <Card
              key={idx}
              className="group overflow-hidden border border-border hover:border-primary/50 transition-all shadow-sm bg-card flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                <img
                  src={s.src}
                  alt={s.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <button
                  onClick={() => setSelectedImage(s.src)}
                  className="absolute bottom-2 right-2 rounded-xl bg-black/70 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Expand screenshot"
                >
                  <Maximize2 className="size-4" />
                </button>
              </div>

              <div className="p-4 space-y-1.5">
                <h3 className="font-bold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.caption}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology Stack Matrix with Heading & Detail Layout */}
      <section className="py-16 border-t bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-primary/30 text-primary font-bold">
              Core Tech Stack
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Production Architecture &amp; Engine Breakdown
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Every layer optimized for speed, reliability, and B2B scalability across Pakistan.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="font-bold text-base text-foreground">TanStack Start &amp; React 19</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Edge SSR Performance</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ultra-fast Server-Side Rendering (SSR) powered by Nitro `node-server` preset for optimal SEO and instant page loads.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
                🛡️
              </div>
              <h3 className="font-bold text-base text-foreground">Supabase Security Definer</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Row Level Security (RLS)</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Row Level Security policies protecting vendor lead purchases, custom tour proposals, and profiles.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                💳
              </div>
              <h3 className="font-bold text-base text-foreground">SafePay Gateway Integration</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Automated PKR Payouts</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Native PKR gateway checkout for vendor subscriptions and custom lead unlocks with automated webhook reconciliation.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                🤖
              </div>
              <h3 className="font-bold text-base text-foreground">GlobeTrek AI &amp; WhatsApp API</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Bilingual NLP &amp; WhatsApp</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated instant WhatsApp receipts, quote notifications, and bilingual (English &amp; Roman Urdu) AI Concierge.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-bold">
            Platform Benchmarks
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            GlobeTrek PK vs Traditional Alternatives
          </h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface/80 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Feature / Architectural Capability</th>
                <th className="p-4 text-center text-primary font-black">GlobeTrek PK</th>
                <th className="p-4 text-center">Generic Clone Scripts</th>
                <th className="p-4 text-center">Standard SaaS PMS</th>
                <th className="p-4 text-center">WordPress Plugins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON_DATA.map((row, i) => (
                <tr key={i} className="hover:bg-surface/40">
                  <td className="p-4 font-semibold text-foreground">{row.feature}</td>
                  <td className="p-4 text-center bg-primary/5">
                    {row.globetrek ? <Check className="size-4 text-emerald-400 mx-auto" /> : "—"}
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {row.cloneScript ? <Check className="size-4 text-muted-foreground mx-auto" /> : "—"}
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {row.saasPms ? <Check className="size-4 text-muted-foreground mx-auto" /> : "—"}
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {row.wordpress ? <Check className="size-4 text-muted-foreground mx-auto" /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enterprise FAQs Section */}
      <section className="py-16 border-t bg-surface/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-5 cursor-pointer transition-all hover:border-border-hover"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between gap-4 font-bold text-sm">
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="size-4 text-primary shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Dialog for Expanded Image */}
      <Dialog open={Boolean(selectedImage)} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-5xl bg-card border-border p-2">
          <DialogHeader className="p-2">
            <DialogTitle className="text-sm font-bold">Expanded Screenshot View</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="overflow-hidden rounded-xl bg-black">
              <img src={selectedImage} alt="Expanded Screenshot" className="w-full h-auto max-h-[80vh] object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
