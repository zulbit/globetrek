import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, ShieldCheck, CreditCard, Sparkles, Building2,
  Users, AlertCircle, CheckCircle2, Clock, Scale, HelpCircle, Printer, ArrowRight, Zap, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/terms")({
  component: TermsAndPoliciesPage,
  head: () => ({
    meta: [
      { title: "Terms of Service & Ecosystem Policies · GlobeTrek PK" },
      {
        name: "description",
        content:
          "Official terms of service, vendor subscription rules, non-refund policy, agency KYC verification, affiliate partner terms, and traveler booking policies for GlobeTrek PK.",
      },
    ],
  }),
});

const SECTIONS = [
  { id: "general", label: "1. General & Traveler Terms", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "subscriptions", label: "2. Vendor Plans & Expiration", icon: CreditCard, color: "text-sky-400" },
  { id: "downgrades", label: "3. Downgrades & Refund Policy", icon: Scale, color: "text-amber-400" },
  { id: "kyc", label: "4. Agency KYC & Verification", icon: Building2, color: "text-teal-400" },
  { id: "affiliates", label: "5. Affiliate & Sales Partners", icon: Users, color: "text-purple-400" },
  { id: "leads", label: "6. Custom Tour Leads & Bidding", icon: Sparkles, color: "text-rose-400" },
];

function TermsAndPoliciesPage() {
  const [activeSection, setActiveSection] = useState("general");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-2xl py-12 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 size-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs font-mono px-3 py-1">
                Official Legal Documentation
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/40 shrink-0">
                  <FileText className="size-7" />
                </span>
                Terms of Service &amp; Ecosystem Policies
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed pt-1">
                Operating rules, vendor subscription terms, non-refund policies, agency KYC standards, affiliate partner guidelines, and traveler protection safeguards for GlobeTrek PK.
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 rounded-xl text-xs print:hidden border-border bg-surface/50 hover:bg-surface">
              <Printer className="size-4" /> Print PDF Version
            </Button>
          </div>
          <div className="pt-3 text-[11px] text-muted-foreground flex items-center gap-2 border-t border-border/40">
            <Clock className="size-3.5 text-primary" /> Last Updated: <span className="font-semibold text-foreground font-mono">July 30, 2026</span> · Version 2.4 (Active)
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Quick Jump Sidebar */}
          <aside className="space-y-2 print:hidden lg:sticky lg:top-8 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2 flex items-center gap-1.5">
              <Zap className="size-3 text-primary" /> Policy Index
            </p>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-md ring-1 ring-primary/50"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground border border-transparent"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${active ? "text-primary-foreground" : sec.color}`} />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Detailed Policy Sections */}
          <div className="space-y-10 text-sm leading-relaxed">
            
            {/* Section 1: General & Traveler Terms */}
            <section id="general" className="rounded-3xl border border-emerald-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-emerald-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                    <ShieldCheck className="size-5" />
                  </span>
                  1. General Platform &amp; Traveler Terms
                </h2>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                  Traveler &amp; Public
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                    1.1 Marketplace Model
                  </span>
                  <p className="pt-1">
                    GlobeTrek PK is an open travel discovery platform connecting travelers with verified Pakistani travel agencies, tour operators, visa consultants, insurance brokers, and flight desks. GlobeTrek PK charges <strong>0% commission on traveler bookings</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 font-bold text-teal-300 text-xs">
                    1.2 Direct Agency Fulfillment
                  </span>
                  <p className="pt-1">
                    All tour packages, visa filings, travel insurance policies, and flight tickets are directly fulfilled and executed by the respective travel vendor. Travelers communicate and transact directly with the agency.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 font-bold text-cyan-300 text-xs">
                    1.3 SafePay Payment Gateway
                  </span>
                  <p className="pt-1">
                    All online subscription and lead credit transactions on GlobeTrek PK are processed securely in Pakistani Rupees (PKR) through SafePay Gateway under 256-bit SSL encryption.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Vendor Plans & Expiration */}
            <section id="subscriptions" className="rounded-3xl border border-sky-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-sky-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 shrink-0">
                    <CreditCard className="size-5" />
                  </span>
                  2. Vendor Subscriptions, Renewal &amp; Expiration Policy
                </h2>
                <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px] font-bold">
                  Vendor Rules
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 font-bold text-sky-300 text-xs">
                    2.1 Expiration Alerts
                  </span>
                  <p className="pt-1">
                    Vendors on paid subscription plans (Starter ₨4,000/mo, Pro ₨7,500/mo, Full Agency ₨15,000/mo) receive automated renewal alerts <strong>7 days, 3 days, and 24 hours</strong> prior to expiration via their Vendor Portal header, WhatsApp, and email with a 1-click SafePay renewal link.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 font-bold text-blue-300 text-xs">
                    2.2 Automated Disabling on Departure Date
                  </span>
                  <p className="pt-1">
                    Tour package listings automatically unpublish (`is_active: false`) once their departure or deadline date passes. Vendors can keep listings active or reactivate expired listings anytime by entering new future departure dates.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 font-bold text-indigo-300 text-xs">
                    2.3 Non-Renewal Action (Auto-Downgrade to Free)
                  </span>
                  <p className="pt-1">
                    If a vendor fails to renew by the billing date, the account automatically converts to the <strong>Starter Free Tier</strong>. Active tour listings exceeding the Free tier limit (1 active listing) automatically pause.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                    2.4 Zero Data Loss Guarantee
                  </span>
                  <p className="pt-1">
                    No vendor package drafts, itineraries, quotes, or customer lead records are ever deleted. All data remains 100% safely preserved and reactivates immediately upon subscription renewal.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Downgrades & Refund Policy */}
            <section id="downgrades" className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />
              <div className="border-b border-amber-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shrink-0">
                    <Scale className="size-5" />
                  </span>
                  3. Plan Downgrade &amp; Non-Refund Policy
                </h2>
                <Badge variant="outline" className="border-amber-500/50 bg-amber-500/15 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Strict Enforcement
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-2xl border border-amber-500/30 bg-card p-5 space-y-3">
                  <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-400" /> Downgrade &amp; Refund Rules Breakdown:
                  </h4>
                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-start gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 text-emerald-400 px-2 py-0.5 font-bold text-[10px] shrink-0 mt-0.5">3.1 UPGRADES</span>
                      <span><strong>Immediate Upgrades:</strong> Plan upgrades take effect immediately so vendors can unlock higher tier features right away.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 text-amber-300 px-2 py-0.5 font-bold text-[10px] shrink-0 mt-0.5">3.2 DOWNGRADES</span>
                      <span><strong>Deferred Downgrades:</strong> When a vendor requests a plan downgrade, the lower tier takes effect at the start of the <strong>next payment cycle</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 text-rose-400 px-2 py-0.5 font-bold text-[10px] shrink-0 mt-0.5">3.3 NO REFUNDS</span>
                      <span><strong>NO REFUNDS:</strong> No partial or prorated refunds are issued for any active billing cycle under any circumstances.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 text-sky-300 px-2 py-0.5 font-bold text-[10px] shrink-0 mt-0.5">3.4 PRIVILEGES</span>
                      <span><strong>Privilege Retention:</strong> Vendors retain 100% of their current higher plan benefits until the end of their paid billing cycle date.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Agency KYC & Verification */}
            <section id="kyc" className="rounded-3xl border border-teal-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-teal-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30 shrink-0">
                    <Building2 className="size-5" />
                  </span>
                  4. Agency Verification &amp; KYC Standards
                </h2>
                <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 text-teal-300 text-[10px] font-bold">
                  Compliance
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 font-bold text-teal-300 text-xs">
                    4.1 Credential Submission
                  </span>
                  <p className="pt-1">
                    To obtain the <strong>✅ Verified Agency Badge</strong>, vendors must submit valid credentials including Agency Legal Name, Department of Tourist Services (DTS) License Number, FBR NTN Number, Owner CNIC, and Physical Office Address via `/vendor/kyc`.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                    4.2 Admin Audit &amp; Approval
                  </span>
                  <p className="pt-1">
                    GlobeTrek PK compliance admins review submitted KYC documents within 24 hours. Fraudulent filings result in immediate account suspension.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Affiliate & Sales Partners */}
            <section id="affiliates" className="rounded-3xl border border-purple-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-purple-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30 shrink-0">
                    <Users className="size-5" />
                  </span>
                  5. Affiliate &amp; Sales Partner Program Policy
                </h2>
                <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                  Partners
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 font-bold text-purple-300 text-xs">
                    5.1 Commission Rates
                  </span>
                  <p className="pt-1">
                    Sales partners earn a <strong>20% one-time commission</strong> on referred vendor plan subscriptions (e.g. ₨ 800 for Travel Desk, ₨ 1,500 for Tour Operator, ₨ 3,000 for Full Agency).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-1 font-bold text-fuchsia-300 text-xs">
                    5.2 30-Day Referral Cookie
                  </span>
                  <p className="pt-1">
                    Referral links store a 30-day tracking cookie on the vendor's browser to attribute registration.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 px-2.5 py-1 font-bold text-pink-300 text-xs">
                    5.3 Content Creator Verification
                  </span>
                  <p className="pt-1">
                    Social media creators (YouTube/Instagram/TikTok) must submit their post URL for 24-hour verification queue approval before receiving commission attribution.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 font-bold text-violet-300 text-xs">
                    5.4 Weekly Payouts
                  </span>
                  <p className="pt-1">
                    Affiliate commissions are disbursed every Friday via JazzCash or EasyPaisa upon reaching the minimum payout threshold of <strong>₨ 1,000 PKR</strong>. Self-referrals and artificial click-inflation are strictly prohibited.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Custom Tour Leads */}
            <section id="leads" className="rounded-3xl border border-rose-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-rose-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-red-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30 shrink-0">
                    <Sparkles className="size-5" />
                  </span>
                  6. Custom Tour Leads &amp; Bidding Cap
                </h2>
                <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 text-[10px] font-bold">
                  Leads Engine
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-300 text-xs">
                    6.1 Max 3 Unlock Cap
                  </span>
                  <p className="pt-1">
                    Each custom tour request submitted by a traveler can be unlocked by a <strong>maximum of 3 verified travel agencies</strong> to prevent traveler spam and maintain high bidding conversion quality.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 text-xs">
                    6.2 Direct WhatsApp Inquiry
                  </span>
                  <p className="pt-1">
                    Once unlocked using lead credits, the vendor gains instant access to the traveler's verified phone number and inquiry specs.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Callout */}
      <footer className="border-t border-border bg-surface/40 py-10 px-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <p className="text-sm font-medium text-foreground">Have questions about our Terms of Service or Vendor Policies?</p>
          <div className="flex justify-center gap-3">
            <Link to="/pricing">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 font-bold border-border bg-card hover:bg-surface">
                View Pricing <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <Link to="/vendor-guide">
              <Button size="sm" variant="default" className="rounded-xl text-xs gap-1.5 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                Vendor Guide <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
