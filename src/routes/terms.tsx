import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, ShieldCheck, CreditCard, Sparkles, Building2,
  Users, AlertCircle, CheckCircle2, Clock, Scale, HelpCircle, Printer, ArrowRight, Zap, Check,
  ShieldAlert, Gavel, AlertTriangle
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
          "Official terms of service, vendor liability disclaimer, non-refund policy, agency KYC verification, arbitration under Pakistani law, and traveler booking policies for GlobeTrek PK.",
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
  { id: "leads", label: "6. Custom Tour & Visa Leads", icon: Sparkles, color: "text-rose-400" },
  { id: "liability", label: "7. Platform & Vendor Liability", icon: ShieldAlert, color: "text-red-400" },
  { id: "arbitration", label: "8. Arbitration & Pakistani Law", icon: Gavel, color: "text-amber-400" },
  { id: "safepay", label: "9. SafePay Security & Chargebacks", icon: CreditCard, color: "text-emerald-400" },
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
            <Clock className="size-3.5 text-primary" /> Last Updated: <span className="font-semibold text-foreground font-mono">August 2026</span> · Version 2.6 (Active)
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
                    1.1 Intermediary Technology &amp; Discovery Marketplace Model
                  </span>
                  <p className="pt-1 text-slate-300 leading-relaxed">
                    GlobeTrek PK is an independent, neutral <strong>travel discovery technology platform and marketplace directory</strong> designed to connect travelers with verified third-party Pakistani travel businesses, tour operators, visa consultants, insurance brokers, and ticketing desks. GlobeTrek PK charges <strong>0% booking commission</strong> to travelers.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 space-y-4">
                  <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="size-4 text-emerald-400" /> Explicit Non-Agency Disclaimers (What GlobeTrek PK is NOT):
                  </h4>

                  <div className="space-y-3 pt-1">
                    {/* Item 1 */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold text-[11px] uppercase tracking-wider">
                          1. NOT A TOUR OPERATOR OR TRANSPORTER
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                        GlobeTrek PK does not own vehicles, arrange transportation, hire tour guides, book hotel rooms directly, or organize tour departures. All tours are operated independently by licensed third-party agencies.
                      </p>
                    </div>

                    {/* Item 2 */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider">
                          2. NOT A VISA FILING AUTHORITY OR EMBASSY AGENT
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                        GlobeTrek PK does not review, issue, stamp, guarantee, or process visas. Visa guidance, document compilation, and drop-box appointments (e.g. Gerry's/VFS/Anatolia) are provided solely by independent consultants. Sovereign embassies and consulates retain 100% exclusive authority over visa issuance or refusal.
                      </p>
                    </div>

                    {/* Item 3 */}
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-300 font-extrabold text-[11px] uppercase tracking-wider">
                          3. NOT AN AIRLINE OR CARRIER
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                        GlobeTrek PK does not operate aircraft, set airfares, or issue airline tickets directly. Flight ticketing desks and IATA agents listed on the platform operate independently.
                      </p>
                    </div>

                    {/* Item 4 */}
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-[11px] uppercase tracking-wider">
                          4. NOT AN INSURANCE UNDERWRITER
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                        Travel insurance policies displayed on the platform are underwritten and issued directly by authorized insurance companies.
                      </p>
                    </div>

                    {/* Item 5 */}
                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/40 text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                          5. NOT A PAYMENT ESCROW FOR BOOKINGS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                        GlobeTrek PK does not collect, hold in escrow, or manage traveler holiday deposits. All booking payments, advances, and contracts are concluded directly between the traveler and the agency.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 font-bold text-teal-300 text-xs">
                    1.2 Direct Bilateral Fulfillment &amp; Agreement
                  </span>
                  <p className="pt-1 text-slate-300 leading-relaxed">
                    All tour itineraries, visa filing services, insurance plans, and flight tickets are directly fulfilled by the respective travel vendor. Travelers negotiate, pay, and execute all arrangements directly with the service vendor under the agency's private terms and conditions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 font-bold text-cyan-300 text-xs">
                    1.3 SafePay Payment Gateway for Platform Subscriptions
                  </span>
                  <p className="pt-1 text-slate-300 leading-relaxed">
                    SafePay Gateway integration on GlobeTrek PK is used strictly for platform vendor subscription fees and B2B custom lead unlock credits in Pakistani Rupees (PKR) with 256-bit SSL encryption.
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

            {/* Section 6: Custom Tour & Visa Leads */}
            <section id="leads" className="rounded-3xl border border-rose-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-rose-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-red-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30 shrink-0">
                    <Sparkles className="size-5" />
                  </span>
                  6. Custom Tour &amp; Custom Visa Leads Engine
                </h2>
                <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 text-[10px] font-bold">
                  B2B Leads Engine
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-300 text-xs">
                    6.1 Custom Tour Lead Bidding (Max 3 Cap)
                  </span>
                  <p className="pt-1">
                    Each bespoke group tour request submitted by a traveler undergoes admin intent verification and can be unlocked by a <strong>maximum of 3 verified travel agencies</strong> (for ₨ 5,000 via SafePay) to prevent traveler spam and maintain high bidding conversion quality.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 text-xs">
                    6.2 Custom Visa &amp; Refusal Consultation Bidding (Max 5 Cap)
                  </span>
                  <p className="pt-1">
                    Custom visa consultation requests and refusal rectification cases are published in real-time and strictly capped at <strong>5 unlocking agencies</strong> (for ₨ 750 via SafePay QuickLink V2). Once 5 agencies unlock the case, the listing automatically closes to prevent lead dilution.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                    6.3 Online Quotation Transmission &amp; Traveler WhatsApp Alerts
                  </span>
                  <p className="pt-1">
                    When an unlocked vendor submits an online proposal, GlobeTrek PK automatically dispatches a secure link to the traveler on WhatsApp. Vendors and travelers communicate directly regarding trip specifics, hotel inclusions, document collection, and payment arrangements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Platform Intermediary & Vendor Liability Disclaimer */}
            <section id="liability" className="rounded-3xl border border-red-500/40 bg-red-500/5 p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none" />
              <div className="border-b border-red-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-red-500/20 text-red-400 ring-1 ring-red-500/40 shrink-0">
                    <ShieldAlert className="size-5" />
                  </span>
                  7. Platform Intermediary Model &amp; Vendor Liability Disclaimer
                </h2>
                <Badge variant="outline" className="border-red-500/50 bg-red-500/15 text-red-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Crucial Legal Notice
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-2xl border border-red-500/30 bg-card p-5 space-y-3">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 font-bold text-red-300 text-xs">
                      7.1 Pure Technology Intermediary &amp; Disintermediation
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      <strong>GlobeTrek PK</strong> (including its owners, developers, operators, and corporate officers) operates strictly and solely as an <strong>online technology marketplace and discovery intermediary</strong> connecting independent travelers with independent third-party travel agencies, tour operators, visa consultants, insurance brokers, and ticketing desks. <strong>GlobeTrek PK is NOT a travel agency, tour organizer, visa filing authority, or carrier.</strong>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 text-xs">
                      7.2 Custom Tours &amp; Visa Quotation Disclaimers
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      GlobeTrek PK plays no role in authoring, verifying the commercial correctness of, underwriting, or guaranteeing any custom tour quotation, itinerary schedule, hotel classification, transport standard, flight ticket, or visa filing advice submitted by vendors. 
                      <strong> GlobeTrek PK explicitly takes NO RESPONSIBILITY OR LIABILITY for the accuracy, legality, fulfillment, quality, safety, or correctness of vendor quotations, nor for any promises made during offline or direct WhatsApp conversations.</strong>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-300 text-xs">
                      7.3 Independent Dealings &amp; Privity of Contract
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      Any commercial booking, money advance, cash deposit, contract, passport handover, or service engagement agreed between a traveler and an agency constitutes a <strong>strictly private, bilateral transaction between the traveler and that agency</strong>. GlobeTrek PK is not a party to, beneficiary of, or guarantor in any user-agency transaction.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 font-bold text-sky-300 text-xs">
                      7.4 Comprehensive Limitation of Platform Liability
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      Under no circumstances shall GlobeTrek PK be liable for any direct, indirect, incidental, punitive, consequential, or exemplary damages, financial losses, trip cancellations, visa rejections, flight delays, medical emergencies, theft, accident, or loss of documentation arising out of dealings with any partner agency or traveler.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Dispute Resolution, Arbitration & Pakistani Law */}
            <section id="arbitration" className="rounded-3xl border border-amber-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-amber-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 shrink-0">
                    <Gavel className="size-5" />
                  </span>
                  8. Dispute Resolution, Arbitration &amp; Governing Pakistani Law
                </h2>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                  Legal Jurisdiction
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 text-xs">
                    8.1 Non-Involvement in User-Vendor Settlements &amp; Arbitrations
                  </span>
                  <p className="pt-1">
                    GlobeTrek PK <strong>shall NOT act as an arbitrator, mediator, stakeholder, or adjudicator</strong> in any disputes, refund claims, or service deficiency allegations between travelers and agencies. GlobeTrek PK will not participate in, fund, or be bound by any third-party arbitration, consumer settlement, or compensation awards agreed between users and vendors.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-300 text-xs">
                    8.2 Mandatory Non-Joinder of GlobeTrek PK
                  </span>
                  <p className="pt-1">
                    Both travelers and partner agencies agree that GlobeTrek PK shall not be impleaded or joined as a co-defendant, respondent, or necessary party in any legal, consumer court, civil litigation, or arbitration proceedings resulting from agency services or user dealings.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                    8.3 Governing Law of the Islamic Republic of Pakistan
                  </span>
                  <p className="pt-1">
                    These Terms, Policies, and any direct platform dispute involving GlobeTrek PK shall be exclusively governed by, construed, and enforced in accordance with the substantive and procedural <strong>Laws of the Islamic Republic of Pakistan</strong> (including the Arbitration Act 1940, Contract Act 1872, and Electronic Transactions Ordinance 2002).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 font-bold text-teal-300 text-xs">
                    8.4 Exclusive Legal Jurisdiction of Islamabad Courts
                  </span>
                  <p className="pt-1">
                    Any suit, legal proceeding, or judicial dispute instituted against GlobeTrek PK shall be subject to the exclusive territorial and subject-matter jurisdiction of the competent <strong>Civil Courts located in Islamabad Capital Territory (ICT), Pakistan</strong>, to the exclusion of all other provincial courts, forums, or tribunals.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9: SafePay Payment Security, Digital Delivery, Chargebacks & Complaints Handling */}
            <section id="safepay" className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <div className="border-b border-emerald-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shrink-0">
                    <CreditCard className="size-5" />
                  </span>
                  9. SafePay Payment Security, Digital Fulfillment &amp; Chargebacks Policy
                </h2>
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  SafePay &amp; SBP Compliance
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 space-y-3">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 text-xs">
                      9.1 PCI-DSS Security &amp; Zero Raw Card Storage
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      All online payment transactions for vendor subscriptions, lead credits, and platform upgrades are processed securely via <strong>SafePay Gateway</strong> under 256-bit SSL encryption. GlobeTrek PK does <strong>NOT</strong> collect, store, or process raw card numbers, CVVs, or bank login credentials on its servers. All cardholder data is tokenized and handled strictly within SafePay's Level-1 PCI-DSS compliant infrastructure.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 font-bold text-cyan-300 text-xs">
                      9.2 Instantaneous Digital Service Delivery &amp; Fulfillment
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      GlobeTrek PK provides purely digital SaaS services and B2B marketplace matchmaking. All purchases (including vendor plan upgrades, AI tool quotas, and Custom Tour/Visa Lead unlock credits) are <strong>delivered instantaneously upon SafePay transaction confirmation</strong> with real-time database unmasking, portal activation, and automated WhatsApp payment receipts.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold text-amber-300 text-xs">
                      9.3 Chargeback Inquiries, Prevention &amp; Bad-Faith Disputes
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      Prior to initiating any chargeback, retrieval request, or payment dispute with your issuing bank or card scheme (Visa/Mastercard/PayPak), you agree to first contact the GlobeTrek Billing Team at <strong>billing@globetrek.pk</strong> to seek direct resolution.
                    </p>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      Initiating an unauthorized or fraudulent chargeback after digital services have been unlocked or subscription access utilized is a material breach of these Terms. In such events, GlobeTrek PK reserves the right to immediately suspend vendor access, blacklist the business entity from universal search, and submit server transaction logs, SafePay payment tokens, and digital delivery timestamps to the relevant financial institution and legal authorities.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 font-bold text-purple-300 text-xs">
                      9.4 Complaints Handling Mechanism &amp; Resolution Timelines
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      For any billing queries, duplicate charge inquiries, or payment assistance, users may submit formal tickets:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300 pt-1">
                      <li><strong>Billing &amp; Payment Support:</strong> <code>billing@globetrek.pk</code></li>
                      <li><strong>General Customer Inquiries:</strong> <code>support@globetrek.pk</code></li>
                      <li><strong>Acknowledgment Timeline:</strong> All billing inquiries are formally acknowledged within <strong>24 business hours</strong>.</li>
                      <li><strong>Resolution Timeline:</strong> Investigation, billing reconciliation, and formal dispute solutions are provided within <strong>3 to 5 business days</strong>.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 font-bold text-teal-300 text-xs">
                      9.5 Regulatory E-Commerce Compliance
                    </span>
                    <p className="pt-1 text-slate-300 leading-relaxed">
                      GlobeTrek PK is an independent travel technology platform. All electronic payment transactions, contracts, and digital services are governed in accordance with the Electronic Transactions Ordinance 2002 and State Bank of Pakistan Payment Systems Regulations.
                    </p>
                  </div>
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
