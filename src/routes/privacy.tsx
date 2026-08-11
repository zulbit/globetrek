import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  CreditCard,
  Building2,
  Users,
  Server,
  UserCheck,
  Clock,
  Printer,
  ArrowRight,
  Zap,
  HelpCircle,
  Mail,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy & Data Protection Policy · GlobeTrek PK" },
      {
        name: "description",
        content:
          "Official Privacy Policy of GlobeTrek PK. SafePay payment security, traveler data protection, zero card storage, vendor KYC compliance, and lead privacy safeguards.",
      },
    ],
  }),
});

const SECTIONS = [
  { id: "overview", label: "1. Overview & Scope", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "collection", label: "2. Information We Collect", icon: FileText, color: "text-sky-400" },
  { id: "safepay-security", label: "3. SafePay & Card Security", icon: CreditCard, color: "text-teal-400" },
  { id: "usage", label: "4. How We Use Your Data", icon: Zap, color: "text-amber-400" },
  { id: "sharing", label: "5. Lead Privacy & Sharing", icon: Users, color: "text-purple-400" },
  { id: "retention", label: "6. Security & Data Retention", icon: Server, color: "text-rose-400" },
  { id: "rights", label: "7. User Rights & Deletion", icon: UserCheck, color: "text-cyan-400" },
  { id: "contact", label: "8. Data Officer & Inquiries", icon: Mail, color: "text-emerald-400" },
];

function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");

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
              <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-xs font-mono px-3 py-1">
                Data Protection &amp; SafePay Compliance
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 shrink-0">
                  <Lock className="size-7" />
                </span>
                Privacy &amp; Data Protection Policy
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed pt-1">
                Transparent information on how GlobeTrek PK collects, protects, tokenizes, and processes traveler and vendor data in compliance with State Bank of Pakistan e-commerce standards and SafePay security protocols.
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
              <Zap className="size-3 text-primary" /> Privacy Index
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
            
            {/* Section 1: Overview & Scope */}
            <section id="overview" className="rounded-3xl border border-emerald-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-emerald-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                    <ShieldCheck className="size-5" />
                  </span>
                  1. Overview &amp; Scope of Policy
                </h2>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                  General Principles
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p className="text-slate-300 leading-relaxed">
                  GlobeTrek PK (<strong>"GlobeTrek"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>) respects your privacy and is firmly committed to protecting the personal data of travelers, travel agency operators, consultants, and visitors who interact with our marketplace (<code>https://globetrek.pk</code>).
                </p>
                <p className="text-slate-300 leading-relaxed">
                  This Privacy Policy details how we collect, process, protect, and handle your information across all web routes, custom quote intake forms, AI chat interactions, and vendor consoles.
                </p>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="collection" className="rounded-3xl border border-sky-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-sky-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 shrink-0">
                    <FileText className="size-5" />
                  </span>
                  2. Categories of Information We Collect
                </h2>
                <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px] font-bold">
                  Data Types
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5 space-y-1">
                    <strong className="text-slate-200 text-xs flex items-center gap-2">
                      <Users className="size-4 text-sky-400" /> A. Traveler Contact &amp; Inquiry Data
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      When you submit a tour inquiry, request a Custom Tour quotation, or file a Custom Visa consultation request, we collect your <strong>Full Name, WhatsApp Mobile Number, Email Address, Resident City, Destination Country, Intended Travel Dates, Passenger Count, and Estimated Budget</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5 space-y-1">
                    <strong className="text-slate-200 text-xs flex items-center gap-2">
                      <FileText className="size-4 text-amber-400" /> B. Visa Case History &amp; Refusal Context
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      For Custom Visa advisory, we collect user-provided details including applicant profession, bank statement availability, preferred submission office (e.g. Gerry's Islamabad, VFS Lahore, Anatolia Karachi), and any prior visa rejection history/clauses submitted voluntarily to facilitate file re-application.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5 space-y-1">
                    <strong className="text-slate-200 text-xs flex items-center gap-2">
                      <Building2 className="size-4 text-teal-400" /> C. Vendor KYC &amp; Verification Documents
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      For travel agencies, tour operators, and visa consultants joining the platform, we collect Agency Legal Business Name, Department of Tourist Services (DTS) license copy, FBR NTN tax registration, owner CNIC/Passport, and corporate bank account IBAN.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5 space-y-1">
                    <strong className="text-slate-200 text-xs flex items-center gap-2">
                      <Server className="size-4 text-purple-400" /> D. Technical, Device &amp; Analytics Data
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      IP address, browser type, operating system version, referring URLs, session timestamps, and anonymous interaction metrics collected to optimize platform performance and security.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: SafePay Payment Security & Zero Raw Card Storage */}
            <section id="safepay-security" className="rounded-3xl border border-teal-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-teal-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30 shrink-0">
                    <CreditCard className="size-5" />
                  </span>
                  3. SafePay Gateway &amp; Payment Card Security
                </h2>
                <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 text-teal-300 text-[10px] font-bold">
                  PCI-DSS Level 1
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-2xl border border-teal-500/30 bg-card p-5 space-y-3">
                  <h4 className="font-bold text-teal-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Lock className="size-4 text-teal-400" /> Zero Raw Card Storage Guarantee:
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    GlobeTrek PK integrates directly with <strong>SafePay Gateway</strong> (licensed by the State Bank of Pakistan) for all online credit/debit card, bank transfer, and mobile wallet transactions.
                  </p>
                  <ul className="space-y-2 list-disc pl-5 text-slate-300">
                    <li><strong>GlobeTrek PK does NOT collect, view, transmit, or store your 16-digit Card Number, Cardholder PIN, or CVV2/CVC security codes</strong> on our application servers or database.</li>
                    <li>Payment processing occurs entirely within SafePay's end-to-end encrypted PCI-DSS Level 1 certified checkout environment.</li>
                    <li>GlobeTrek PK only receives secure, tokenized transaction identifiers (e.g. <code>trans_...</code>) and payment confirmation statuses (Paid/Failed) to unlock software subscriptions or lead credits.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: How We Use Your Data */}
            <section id="usage" className="rounded-3xl border border-amber-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-amber-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 shrink-0">
                    <Zap className="size-5" />
                  </span>
                  4. How We Process &amp; Use Your Data
                </h2>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                  Processing Purposes
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <ul className="space-y-2.5 text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Connecting Travelers with Verified Agencies:</strong> Displaying submitted custom inquiries to licensed Pakistani vendors who bid with tailored tour and visa proposals.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Automated WhatsApp Notifications:</strong> Dispatching real-time quote delivery links, proposal updates, and payment receipts directly to your WhatsApp mobile number.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Regulatory KYC &amp; Verification:</strong> Validating agency business legitimacy with the Department of Tourist Services (DTS) and FBR NTN registry to eliminate fraudulent operators.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>AI Travel Concierge Queries:</strong> Grounding AI responses in live database listings to deliver accurate package recommendations in English and Roman Urdu.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5: Lead Privacy & Controlled Sharing */}
            <section id="sharing" className="rounded-3xl border border-purple-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-purple-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30 shrink-0">
                    <Users className="size-5" />
                  </span>
                  5. Third-Party Sharing &amp; Anti-Spam Lead Controls
                </h2>
                <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                  Zero Data Selling
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p className="text-slate-300 leading-relaxed font-semibold">
                  GlobeTrek PK has a strict ZERO-SPAM policy. We NEVER sell, rent, or lease your personal contact details to third-party telemarketers, bulk SMS brokers, or advertising networks.
                </p>
                <div className="rounded-xl border border-purple-500/20 bg-surface/50 p-4 space-y-2 text-slate-300">
                  <strong className="text-purple-300 text-xs">Controlled B2B Marketplace Sharing:</strong>
                  <ul className="list-disc pl-5 space-y-1.5 pt-1">
                    <li><strong>Custom Tour Requests:</strong> Unmasked to a <strong>strict maximum of 3 verified travel agencies</strong> who unlock the inquiry to submit competing bids.</li>
                    <li><strong>Custom Visa Requests:</strong> Unmasked to a <strong>strict maximum of 5 verified visa consultants</strong> to prevent overwhelming the applicant.</li>
                    <li><strong>Catalog Direct Inquiries:</strong> Transmitted solely to the specific travel agency whose listing you inquired about.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Security & Data Retention */}
            <section id="retention" className="rounded-3xl border border-rose-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-rose-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-red-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30 shrink-0">
                    <Server className="size-5" />
                  </span>
                  6. Technical Security &amp; Data Retention
                </h2>
                <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 text-[10px] font-bold">
                  256-Bit SSL &amp; RLS
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p className="text-slate-300 leading-relaxed">
                  All database operations and API calls are secured with 256-bit SSL encryption and strict Supabase Row-Level Security (RLS) policies. Unauthenticated users cannot access sensitive customer contact numbers or vendor KYC documents.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Inquiry records and proposal histories are retained to enable travelers to access their Traveler Hub archive. Users can request immediate permanent deletion at any time.
                </p>
              </div>
            </section>

            {/* Section 7: User Rights & Deletion */}
            <section id="rights" className="rounded-3xl border border-cyan-500/30 bg-card p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
              <div className="border-b border-cyan-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30 shrink-0">
                    <UserCheck className="size-5" />
                  </span>
                  7. Your Rights &amp; Data Erasure Requests
                </h2>
                <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold">
                  User Control
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p className="text-slate-300 leading-relaxed">
                  You have the right to request access to, correction of, or permanent erasure of your personal data stored on GlobeTrek PK:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Right to Rectification:</strong> Update your profile name, phone number, and city anytime in your account dashboard.</li>
                  <li><strong>Right to Deletion:</strong> Email <code>privacy@globetrek.pk</code> with the subject <em>"Data Erasure Request"</em>. We will permanently purge your inquiry records within <strong>7 business days</strong>.</li>
                  <li><strong>Right to Opt-Out:</strong> You can opt out of non-transactional WhatsApp notifications by replying <code>STOP</code> to any platform message.</li>
                </ul>
              </div>
            </section>

            {/* Section 8: Contact Data Protection Officer */}
            <section id="contact" className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-6 sm:p-8 space-y-5 shadow-card relative overflow-hidden">
              <div className="border-b border-emerald-500/20 pb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shrink-0">
                    <Mail className="size-5" />
                  </span>
                  8. Privacy Officer &amp; Regulatory Inquiries
                </h2>
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Contact
                </Badge>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p className="text-slate-300 leading-relaxed">
                  If you have questions regarding this Privacy Policy, SafePay security practices, or data handling protocols, please reach out to our Compliance Desk:
                </p>
                <div className="rounded-2xl border border-emerald-500/30 bg-card p-4 text-slate-300 space-y-2">
                  <div>📧 <strong>Privacy &amp; Data Protection:</strong> <code>privacy@globetrek.pk</code></div>
                  <div>💳 <strong>Billing &amp; Payment Support:</strong> <code>billing@globetrek.pk</code></div>
                  <div>🌐 <strong>Official Portal:</strong> <code>https://globetrek.pk</code></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Callout */}
      <footer className="border-t border-border bg-surface/40 py-10 px-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <p className="text-sm font-medium text-foreground">Have questions about our Privacy or SafePay Security?</p>
          <div className="flex justify-center gap-3">
            <Link to="/terms">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 font-bold border-border bg-card hover:bg-surface">
                Terms of Service <ArrowRight className="size-3.5" />
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
