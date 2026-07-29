import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, ShieldCheck, CreditCard, Sparkles, Building2,
  Users, AlertCircle, CheckCircle2, Clock, Scale, HelpCircle, Printer, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/terms")({
  component: TermsAndPoliciesPage,
  head: () => ({
    meta: [
      { title: "Terms of Service & Platform Policies · GlobeTrek PK" },
      {
        name: "description",
        content:
          "Official terms of service, vendor subscription rules, non-refund policy, agency KYC verification, affiliate partner terms, and traveler booking policies for GlobeTrek PK.",
      },
    ],
  }),
});

const SECTIONS = [
  { id: "general", label: "1. General & Traveler Terms", icon: ShieldCheck },
  { id: "subscriptions", label: "2. Vendor Plans & Expiration", icon: CreditCard },
  { id: "downgrades", label: "3. Downgrades & Refund Policy", icon: Scale },
  { id: "kyc", label: "4. Agency KYC & Verification", icon: Building2 },
  { id: "affiliates", label: "5. Affiliate & Sales Partners", icon: Users },
  { id: "leads", label: "6. Custom Tour Leads & Bidding", icon: Sparkles },
];

function TermsAndPoliciesPage() {
  const [activeSection, setActiveSection] = useState("general");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xl py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-mono">
                Official Legal Documentation
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <FileText className="size-8 text-primary shrink-0" />
                Terms of Service &amp; Ecosystem Policies
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Operating rules, vendor subscription terms, non-refund policies, agency KYC standards, affiliate partner guidelines, and traveler protection safeguards for GlobeTrek PK.
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 rounded-xl text-xs print:hidden">
              <Printer className="size-4" /> Print PDF Version
            </Button>
          </div>
          <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-2">
            <Clock className="size-3.5 text-primary" /> Last Updated: <span className="font-semibold text-foreground font-mono">July 30, 2026</span> · Version 2.4 (Active)
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Quick Jump Sidebar */}
          <aside className="space-y-2 print:hidden lg:sticky lg:top-8 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Policy Index
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Detailed Policy Sections */}
          <div className="space-y-12 text-sm leading-relaxed">
            {/* Section 1: General & Traveler Terms */}
            <section id="general" className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" /> 1. General Platform &amp; Traveler Terms
                </h2>
                <Badge variant="secondary" className="text-[10px]">Traveler &amp; Public</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>1.1 Marketplace Model:</strong> GlobeTrek PK is an open travel discovery platform connecting travelers with verified Pakistani travel agencies, tour operators, visa consultants, insurance brokers, and flight desks. GlobeTrek PK charges <strong>0% commission on traveler bookings</strong>.
                </p>
                <p>
                  <strong>1.2 Direct Agency Fulfillment:</strong> All tour packages, visa filings, travel insurance policies, and flight tickets are directly fulfilled and executed by the respective travel vendor. Travelers communicate and transact directly with the agency.
                </p>
                <p>
                  <strong>1.3 SafePay Payment Gateway:</strong> All online subscription and lead credit transactions on GlobeTrek PK are processed securely in Pakistani Rupees (PKR) through SafePay Gateway under 256-bit SSL encryption.
                </p>
              </div>
            </section>

            {/* Section 2: Vendor Plans & Expiration */}
            <section id="subscriptions" className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="size-5 text-sky-400" /> 2. Vendor Subscriptions, Renewal &amp; Expiration Policy
                </h2>
                <Badge variant="secondary" className="text-[10px]">Vendor Rules</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>2.1 Expiration Alerts:</strong> Vendors on paid subscription plans (Starter ₨4,000/mo, Pro ₨7,500/mo, Full Agency ₨15,000/mo) receive automated renewal alerts <strong>7 days, 3 days, and 24 hours</strong> prior to expiration via their Vendor Portal header, WhatsApp, and email with a 1-click SafePay renewal link.
                </p>
                <p>
                  <strong>2.2 Automated Disabling on Departure Date:</strong> Tour package listings automatically unpublish (`is_active: false`) once their departure or deadline date passes. Vendors can keep listings active or reactivate expired listings anytime by entering new future departure dates.
                </p>
                <p>
                  <strong>2.3 Non-Renewal Action (Auto-Downgrade to Free):</strong> If a vendor fails to renew by the billing date, the account automatically converts to the <strong>Starter Free Tier</strong>. Active tour listings exceeding the Free tier limit (1 active listing) automatically pause.
                </p>
                <p>
                  <strong>2.4 Zero Data Loss Guarantee:</strong> No vendor package drafts, itineraries, quotes, or customer lead records are ever deleted. All data remains 100% safely preserved and reactivates immediately upon subscription renewal.
                </p>
              </div>
            </section>

            {/* Section 3: Downgrades & Refund Policy */}
            <section id="downgrades" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-amber-500/20 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Scale className="size-5 text-amber-400" /> 3. Plan Downgrade &amp; Non-Refund Policy
                </h2>
                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px]">Strict Enforcement</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-xl border border-amber-500/20 bg-card p-4 space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="size-4" /> Downgrade &amp; Refund Rules:
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-xs">
                    <li>
                      <strong>Immediate Upgrades:</strong> Upgrades take effect immediately so vendors can unlock higher tier features right away.
                    </li>
                    <li>
                      <strong>Deferred Downgrades:</strong> When a vendor requests a plan downgrade, the lower tier takes effect at the start of the <strong>next payment cycle</strong>.
                    </li>
                    <li>
                      <strong>NO REFUNDS:</strong> No partial or prorated refunds are issued for any active billing cycle under any circumstances.
                    </li>
                    <li>
                      <strong>Privilege Retention:</strong> Vendors retain 100% of their current higher plan benefits until the end of their paid billing cycle date.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Agency KYC & Verification */}
            <section id="kyc" className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Building2 className="size-5 text-emerald-400" /> 4. Agency Verification &amp; KYC Standards
                </h2>
                <Badge variant="secondary" className="text-[10px]">Compliance</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>4.1 Credential Submission:</strong> To obtain the <strong>✅ Verified Agency Badge</strong>, vendors must submit valid credentials including Agency Legal Name, Department of Tourist Services (DTS) License Number, FBR NTN Number, Owner CNIC, and Physical Office Address via `/vendor/kyc`.
                </p>
                <p>
                  <strong>4.2 Admin Audit:</strong> GlobeTrek PK compliance admins review submitted KYC documents within 24 hours. Fraudulent filings result in immediate account suspension.
                </p>
              </div>
            </section>

            {/* Section 5: Affiliate & Sales Partners */}
            <section id="affiliates" className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="size-5 text-purple-400" /> 5. Affiliate &amp; Sales Partner Program Policy
                </h2>
                <Badge variant="secondary" className="text-[10px]">Partners</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>5.1 Commission Rates:</strong> Sales partners earn a <strong>20% one-time commission</strong> on referred vendor plan subscriptions (e.g. ₨ 800 for Travel Desk, ₨ 1,500 for Tour Operator, ₨ 3,000 for Full Agency).
                </p>
                <p>
                  <strong>5.2 30-Day Referral Cookie:</strong> Referral links store a 30-day tracking cookie on the vendor's browser to attribute registration.
                </p>
                <p>
                  <strong>5.3 Content Creator Verification:</strong> Social media creators (YouTube/Instagram/TikTok) must submit their post URL for 24-hour verification queue approval before receiving commission attribution.
                </p>
                <p>
                  <strong>5.4 Weekly Payouts:</strong> Affiliate commissions are disbursed every Friday via JazzCash or EasyPaisa upon reaching the minimum payout threshold of <strong>₨ 1,000 PKR</strong>. Self-referrals and artificial click-inflation are strictly prohibited.
                </p>
              </div>
            </section>

            {/* Section 6: Custom Tour Leads */}
            <section id="leads" className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-400" /> 6. Custom Tour Leads &amp; Bidding Cap
                </h2>
                <Badge variant="secondary" className="text-[10px]">Leads Engine</Badge>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>6.1 Max 3 Unlock Cap:</strong> Each custom tour request submitted by a traveler can be unlocked by a <strong>maximum of 3 verified travel agencies</strong> to prevent traveler spam and maintain high bidding conversion quality.
                </p>
                <p>
                  <strong>6.2 Direct WhatsApp Inquiry:</strong> Once unlocked using lead credits, the vendor gains instant access to the traveler's verified phone number and inquiry specs.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Callout */}
      <footer className="border-t border-border bg-surface/40 py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-md space-y-3">
          <p>Have questions about our Terms of Service or Vendor Policies?</p>
          <div className="flex justify-center gap-3">
            <Link to="/pricing">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1">
                View Pricing <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <Link to="/vendor-guide">
              <Button size="sm" variant="secondary" className="rounded-xl text-xs gap-1">
                Vendor Guide <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
