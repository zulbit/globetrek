import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export const Route = createFileRoute("/enterprise")({
  component: EnterpriseShowcase,
  head: () => ({
    meta: [
      { title: "GlobeTrek PK — Enterprise Travel Engine & Software Architecture Whitepaper" },
      {
        name: "description",
        content:
          "Enterprise B2B travel marketplace architecture. Full SSR stack with TanStack Start, React 19, Supabase RLS, SafePay PKR payments, WhatsApp API, and OpenRouter AI Concierge.",
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
    a: "The AI Concierge leverages OpenRouter (`openai/gpt-4o-mini`) via `@ai-sdk/openai-compatible`. It seamlessly handles travel inquiries in both English and Roman Urdu, querying live database tables for tours, visa services, insurance plans, and flight tickets.",
  },
  {
    q: "How does the Custom Lead Bidding & SafePay Integration operate?",
    a: "Custom lead submissions start in an unverified status. Admin calls to verify traveler budget before publishing. Vendors unlock contact details via SafePay PKR payment (capped at 3 vendors max), then submit online quotations which send automated WhatsApp alerts to the traveler.",
  },
];

function EnterpriseShowcase() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
            ⚡ Enterprise B2B Travel Marketplace Stack
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            The Modern Travel Marketplace Engine for Tour Operators &amp; Agencies
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            A high-performance Server-Side Rendered platform built with TanStack Start, React 19, Supabase RLS, SafePay Gateway, WhatsApp Automation, and Bilingual AI Concierge.
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

      {/* Screenshot Showcase Gallery */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-bold">
            Live Interface Showcase
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inspected Platform Interfaces
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
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
                    // Fallback visual container if image loading
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

              <div className="p-4 space-y-1">
                <h3 className="font-bold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.caption}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology Stack Matrix */}
      <section className="py-16 border-t bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="outline" className="border-primary/30 text-primary font-bold">
              Core Tech Stack
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Production Architecture
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="font-bold text-base">TanStack Start &amp; React 19</h3>
              <p className="text-xs text-muted-foreground">
                Ultra-fast Server-Side Rendering (SSR) powered by Nitro `node-server` preset for optimal SEO and instant page loads.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
                🛡️
              </div>
              <h3 className="font-bold text-base">Supabase Security Definer</h3>
              <p className="text-xs text-muted-foreground">
                Row Level Security (RLS) policies protecting vendor lead purchases, custom tour proposals, and profiles.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                💳
              </div>
              <h3 className="font-bold text-base">SafePay Gateway Integration</h3>
              <p className="text-xs text-muted-foreground">
                Native PKR gateway checkout for vendor subscriptions and custom lead unlocks with automated webhook reconciliation.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border-border bg-card">
              <div className="size-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <h3 className="font-bold text-base">WhatsApp API &amp; AI Concierge</h3>
              <p className="text-xs text-muted-foreground">
                Automated instant WhatsApp receipts, quote notifications, and bilingual AI concierge travel assistant.
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
