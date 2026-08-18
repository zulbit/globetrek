import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { generateEnterpriseDemoAIServer, DemoItineraryStructure } from "@/lib/guide-ai.functions";
import { trackEvent } from "@/lib/analytics";
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
    src: "/images/guide/vendor-custom-visa-leads.png",
    title: "B2B Custom Visa Consultation & Refusal Handling Marketplace",
    caption: "Real-time custom visa inquiries, refusal rectification cases, ₨ 750 SafePay unlocks, 5-bid competitive cap, and proposal builder.",
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
    feature: "Custom Tour Lead Bidding with Max 3 Unlock Cap",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Custom Visa Leads & Refusal Rectification Engine (₨ 750 / Max 5 Bids)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Automatic Customer Account Registration & Traveler Hub Proposals Portal",
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
    feature: "DeepSeek V4 Flash & GPT-4o Premium Model Integration",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Qwen-VL Visual Contact Shield (Automated OCR Disintermediation & Phone Blocking)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Fair 30-Day Rolling Quota Cycle (No Loss on Mid-Month Signup)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Verified Business Rating & Governance Scorecard (DTS + Post-Trip)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "AI Tour Itinerary & Description Generator (Tier-Gated)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "AI Embassy Fee Lookup for Visa Desks",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Real-Time AI Lead Capture from Chat",
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
    feature: "Live Dynamic SEO Optimization Center & Schema Auditor",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Real-Time Google Analytics (GA4) & Audience Traffic Intelligence",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "WhatsApp Event Automation & Audience Template Engine",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Agency Verification (KYC) & Compliance Review Dialog",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Admin Impersonation Mode ('Login As' Vendor)",
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
  {
    feature: "OpenStreetMap Interactive Tour Explorer & Flight Arc Paths",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Tool-Based Dynamic DB Search (search_catalog)",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Lead Privacy Protection & Obfuscated WhatsApp Alerts",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
  {
    feature: "Interactive Clickable Action Chips in Chat",
    globetrek: true,
    cloneScript: false,
    saasPms: false,
    wordpress: false,
  },
];

const FAQS = [
  {
    q: "How does the OpenStreetMap Interactive Tour Explorer work?",
    a: "GlobeTrek PK integrates an interactive, split-screen Leaflet & CartoDB OpenStreetMap engine on /tours. It renders Pakistani departure hubs (LHE, KHI, ISB), destination landing airports (IST, CDG, DXB, BKK, etc.), curved flight arcs with flight time badges (e.g. ✈️ 5h 50m), and interactive multi-hop itinerary stop popups with exact dates. This premium feature is integrated as a placement benefit for Pro Tour Operator (₨ 7,500/mo) and Full Agency (₨ 12,000/mo) subscription plans.",
  },
  {
    q: "How does Lead Privacy & WhatsApp Notification Obfuscation operate?",
    a: "When a traveler submits contact details or requests a callback, the AI Concierge triggers the capture_lead server tool. To protect vendor subscription monetization, the automated WhatsApp alert sent to vendors masks traveler contact details (e.g. 0300****67) and provides a secure link to the Vendor Portal (/vendor/leads) where partners unlock full lead details according to their plan credits.",
  },
  {
    q: "Can GlobeTrek PK be customized for white-label enterprise deployment?",
    a: "Yes! GlobeTrek PK is built on modular architecture with 100% source code ownership. It can be white-labeled with custom logos, domains, regional currencies, and local payment gateways.",
  },
  {
    q: "How does the Bilingual AI Concierge work?",
    a: "The AI Concierge (powered by OpenRouter GPT-4o-mini via @ai-sdk/openai-compatible) detects the traveler's language automatically — English replies for English queries, warm Roman Urdu replies for Roman Urdu queries. For example, a traveler typing 'Dubai ka 4 din ka package Karachi se chahiye' receives a complete Roman Urdu reply with the relevant listing, pricing in ₨, and a lead-capture prompt. When a traveler shares their phone number, the AI automatically calls the capture_lead server function — writing a lead record to the database and triggering an instant WhatsApp notification to the vendor.",
  },
  {
    q: "What AI tools are available inside the Vendor Dashboard?",
    a: "The Vendor Dashboard includes 3 AI tools: (1) AI Description Generator — creates 55–75 word marketing-optimized package summaries (Starter: 10/month, Pro+: unlimited). (2) Premium AI Trip Planner — generates complete day-by-day itineraries with timed activity slots, including multi-country routing for Europe (Pro: 50/month, Agency: unlimited). (3) AI Embassy Fee Lookup — provides current visa embassy fee estimates in PKR with source notes and confidence levels (Pro & Agency only). All tools run server-side via TanStack Start createServerFn with usage tracked in the ai_usage_events table.",
  },
  {
    q: "How does Roman Urdu support work across the AI tools?",
    a: "Roman Urdu (Urdu written in Latin/English script — the dominant messaging style of Pakistani travelers) is natively supported in two AI tools: the customer-facing Bilingual Concierge and the vendor-facing AI Partner Operational Assistant in the Vendor Guide. Both tools detect the input language at inference time and respond in matching style — no language selection required. The system prompt instructs the model: 'English request → English reply. Roman Urdu request → warm Roman Urdu reply.' The Tour Itinerary Generator and Visa Fee Lookup are English-only since they output structured data (JSON itineraries and PKR fee estimates).",
  },
  {
    q: "How does the Custom Lead Bidding & SafePay Integration operate?",
    a: "Custom lead submissions start in an unverified status. Admin calls to verify traveler budget before publishing. Vendors unlock contact details via SafePay PKR payment (capped at 3 vendors max), then submit online quotations which send automated WhatsApp alerts to the traveler.",
  },
  {
    q: "How does the Custom Visa Consultation & Refusal Rectification Engine operate?",
    a: "Travelers facing complex visa requirements, drop-box submissions (Gerry's, VFS, Anatolia), or previous visa rejections (UK, Schengen, US, Canada) submit their case details and intended travel dates at /custom-visa. The engine auto-registers a free Traveler Hub account and broadcasts the verified inquiry to the B2B marketplace. Verified Pakistani visa consultants unlock applicant contact details for ₨ 750 via SafePay (capped at 5 unlocking agencies to preserve lead quality). Unlocked agencies submit structured proposals with fee breakdowns and consultation modes (in-person vs remote e-filing), triggering automated WhatsApp notifications and online comparison links for the traveler.",
  },
  {
    q: "How does Google Analytics (GA4) & Real-Time Traffic Intelligence work?",
    a: "GlobeTrek PK integrates Google Analytics (GA4) with native Single Page Application (SPA) route change tracking. Client-side navigations across tour, visa, insurance, and vendor portals are captured in real-time. Lead generation funnels, ₨ 5,000 custom lead unlocks, and SafePay subscriptions are instrumented as custom conversion events with PKR monetary value for comprehensive marketing and audience analytics.",
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
    trackEvent("enterprise_ai_demo_generate", {
      destination: demoDestination,
      duration_days: demoDuration,
    });
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

            <a
              href="mailto:enterprise@globetrek.pk"
              onClick={() => trackEvent("contact_enterprise_click", { method: "email" })}
              className="inline-flex"
            >
              <Button size="lg" variant="outline" className="gap-2 font-semibold">
                Request Enterprise Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Enterprise Feature Matrix & Platform Capabilities Section (Moved Up for Immediate Visibility) */}
      <section id="features" className="py-12 border-b bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold px-3 py-1 text-xs">
              ⚡ Full Platform Capabilities &amp; Enterprise Feature Matrix
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              GlobeTrek PK Enterprise Capabilities &amp; Feature Comparison
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Comparing GlobeTrek PK's modern SSR travel architecture against traditional clone scripts and legacy PMS platforms.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface/90 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-4 sm:px-6">Feature / Architectural Capability</th>
                  <th className="p-4 text-center text-primary font-black bg-primary/10 border-x border-primary/20">
                    GlobeTrek PK (Enterprise)
                  </th>
                  <th className="p-4 text-center">Generic Clone Scripts</th>
                  <th className="p-4 text-center">Standard SaaS PMS</th>
                  <th className="p-4 text-center">WordPress Plugins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_DATA.map((row, i) => {
                  const isNewFeature =
                    row.feature.includes("DeepSeek") ||
                    row.feature.includes("Rolling Quota") ||
                    row.feature.includes("Rating");

                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        isNewFeature ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-surface/40"
                      }`}
                    >
                      <td className="p-4 sm:px-6 font-semibold text-foreground flex items-center gap-2">
                        <span>{row.feature}</span>
                        {isNewFeature && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0">
                            NEW
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-center bg-primary/5 border-x border-primary/10 font-bold">
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
                  );
                })}
              </tbody>
            </table>
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

      {/* GlobeTrek AI Engine — Dedicated Feature Section */}
      <section className="py-16 border-t bg-gradient-to-b from-purple-500/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold px-3 py-1 text-xs">
              <Bot className="size-3.5 mr-1.5" /> GlobeTrek AI Engine
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              4 Production-Ready AI Tools
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Powered by state-of-the-art AI models (DeepSeek V4 Flash &amp; GPT-4o) via <code className="bg-surface px-1.5 py-0.5 rounded text-primary font-mono">@ai-sdk/openai-compatible</code> — all tools run server-side via TanStack Start, never exposing API keys to the client.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Tool 1: Bilingual Concierge */}
            <Card className="p-6 space-y-4 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                  🌐
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">All Visitors — No Login</Badge>
                  <h3 className="font-bold text-base text-foreground">Bilingual AI Travel Concierge</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Floating chat widget on every public page. Auto-detects language — answers in <strong>English</strong> or <strong>Roman Urdu</strong> based on the traveler's input. Grounds every response in live Supabase catalog data across all 4 service verticals.
              </p>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 space-y-1">
                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Roman Urdu Example</p>
                <p className="text-xs text-foreground italic">
                  Traveler: <em>"Dubai ka 4 din ka package Karachi se chahiye"</em>
                </p>
                <p className="text-xs text-muted-foreground italic">
                  AI replies in Roman Urdu with 🇦🇪 flag, bold ₨ pricing, and a lead-capture prompt.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Live catalog grounding — never fabricates packages</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Auto-calls <code className="font-mono">capture_lead</code> when phone number shared → WhatsApp alert</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Context-aware quick-reply chips guide the booking funnel</li>
              </ul>
            </Card>

            {/* Tool 2: Premium AI Trip Planner */}
            <Card className="p-6 space-y-4 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                  ✈️
                </div>
                <div className="space-y-1">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-bold">Starter / Pro / Agency — Tier-Gated</Badge>
                  <h3 className="font-bold text-base text-foreground">Premium AI Trip Planner</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built into the Vendor Dashboard tour editor. Generates marketing-ready package descriptions and complete day-by-day itineraries with timed activity slots — tailored to Pakistani travelers.
              </p>
              <div className="rounded-xl border border-border bg-surface/60 overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead className="bg-surface/80 border-b border-border">
                    <tr>
                      <th className="p-2 text-left font-bold text-muted-foreground">Plan</th>
                      <th className="p-2 text-center font-bold text-muted-foreground">AI Descriptions</th>
                      <th className="p-2 text-center font-bold text-muted-foreground">Full Trip Plans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    <tr><td className="p-2 font-semibold">Starter</td><td className="p-2 text-center">10 / 30-days</td><td className="p-2 text-center text-muted-foreground">—</td></tr>
                    <tr><td className="p-2 font-semibold">Pro</td><td className="p-2 text-center text-emerald-400 font-bold">Unlimited</td><td className="p-2 text-center font-bold">50 / 30-days</td></tr>
                    <tr><td className="p-2 font-semibold">Agency</td><td className="p-2 text-center text-emerald-400 font-bold">Unlimited</td><td className="p-2 text-center text-emerald-400 font-bold">Unlimited</td></tr>
                  </tbody>
                </table>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Fair 30-Day Rolling Billing Guarantee — no loss on mid-month signups</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Quota usage tracked per account in <code className="font-mono">ai_usage_events</code> table</li>
              </ul>
            </Card>

            {/* Tool 3: Visa AI Embassy Fee Lookup */}
            <Card className="p-6 space-y-4 border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-2xl shrink-0">
                  📄
                </div>
                <div className="space-y-1">
                  <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] font-bold">Pro & Agency Only</Badge>
                  <h3 className="font-bold text-base text-foreground">AI Embassy Fee Lookup</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Saves visa consultants hours of research. Fetches AI-estimated embassy / VFS / TLS government visa fees in PKR for any destination country and visa type — with source attribution and confidence rating.
              </p>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 space-y-2">
                <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Returns Per Query</p>
                <ul className="space-y-1 text-xs text-foreground">
                  <li>• Fee in ₨ PKR + original currency (e.g. USD 185)</li>
                  <li>• Source name (e.g. VFS Global Schengen fee schedule)</li>
                  <li>• Confidence: low / medium / high</li>
                  <li>• Last known update period</li>
                </ul>
              </div>
              <p className="text-[10px] text-muted-foreground italic">⚠️ AI estimate — vendor must verify with embassy before quoting client.</p>
            </Card>

            {/* Tool 4: AI Partner Operational Assistant */}
            <Card className="p-6 space-y-4 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                  🤖
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">All Partners — No Login</Badge>
                  <h3 className="font-bold text-base text-foreground">AI Partner Operational Assistant</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Always-on Q&A agent embedded in the Vendor Guide page. Knows the complete GlobeTrek rulebook — KYC requirements, lead bidding rules, SafePay flows, AI tool quotas, and marketplace code of conduct.
              </p>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 space-y-1">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Bilingual Prompts Supported</p>
                <p className="text-xs text-foreground italic">"Pro plan mein kitne AI itinerary plans milte hain?"</p>
                <p className="text-xs text-foreground italic">"How does the Max 3 vendor unlock cap work?"</p>
                <p className="text-xs text-foreground italic">"SafePay payment mein kitna time lagta hai?"</p>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> English & Roman Urdu — auto-detected at inference time</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Structured bold heading + bullet detail format in every response</li>
              </ul>
            </Card>

            {/* Tool 5: Qwen-VL Visual Contact Shield & Anti-Disintermediation Engine */}
            <Card className="p-6 space-y-4 border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-card to-card shadow-sm sm:col-span-2">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl shrink-0">
                  🛡️
                </div>
                <div className="space-y-1">
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] font-bold">Marketplace Governance &amp; Anti-Disintermediation</Badge>
                  <h3 className="font-bold text-base text-foreground">Qwen-VL Visual Contact Shield (Automated Image OCR Moderation)</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Protects the commercial integrity of the B2B marketplace by automatically scanning all vendor-uploaded tour cover photos and banners using high-speed <strong>Qwen-VL Vision-Language Models</strong>.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Phone &amp; WhatsApp OCR</span>
                  <p className="text-xs text-foreground">Detects Pakistani mobile numbers (03xx, +92), landlines, and WhatsApp contact text embedded in images.</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">B2B Disintermediation Guard</span>
                  <p className="text-xs text-foreground">Prevents vendors from bypassing platform lead flows with external booking URLs or agency contact watermarks.</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Sub-Second Live Feedback</span>
                  <p className="text-xs text-foreground">Scans uploads in &lt; 500ms and returns instant corrective toasts with zero upload delay for clean destination imagery.</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Powered by Qwen-VL Vision Models (QwenCloud &amp; OpenRouter fallback)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" /> Every moderation scan logged in Admin AI Analytics with latency and audit metrics</li>
              </ul>
            </Card>
          </div>
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

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                🔍
              </div>
              <h3 className="font-bold text-base text-foreground">SEO Optimization Center</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Live Dynamic SEO Auditor</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time audit of static routes and dynamic database catalog pages with schema.org validation and Google Search Console integration.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <h3 className="font-bold text-base text-foreground">WhatsApp Event Automation</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Audience-Filtered Templates</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated dispatch engine for Traveler, Vendor, and Admin notifications with audience tab filters and custom variables.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                📜
              </div>
              <h3 className="font-bold text-base text-foreground">Agency KYC &amp; Verification</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Compliance Document Vault</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full DTS license, FBR NTN tax ID, owner CNIC, physical address, and bank IBAN review dialog for platform administrators.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                👤
              </div>
              <h3 className="font-bold text-base text-foreground">Admin Impersonation Mode</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: 'Login As' Vendor Context</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Secure real-time impersonation of vendor accounts with sticky warning header and one-click exit back to platform admin console.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                📊
              </div>
              <h3 className="font-bold text-base text-foreground">Google Analytics (GA4) Engine</h3>
              <p className="text-xs text-muted-foreground font-medium">
                <strong>Heading: Real-Time Traffic &amp; Monetization Tracking</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Native GA4 integration with automated Single Page Application (SPA) route tracking, PKR lead conversion funnels, and real-time audience analytics.
              </p>
            </Card>
          </div>
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
