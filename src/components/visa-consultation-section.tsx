import { useNavigate } from "@tanstack/react-router";
import {
  FileCheck2,
  AlertTriangle,
  Building2,
  MessageSquareCheck,
  ArrowRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  {
    icon: AlertTriangle,
    iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    title: "Prior Visa Refusal Rectification",
    desc: "Overcome US 214(b), Schengen Clause 2/13 & UK Paragraph V4.2 with expert justification cover letters.",
  },
  {
    icon: Building2,
    iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    title: "Gerry's, VFS & Embassy Support",
    desc: "Biometric slot assistance & drop-box coordination across Islamabad, Lahore, Karachi & Peshawar.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    title: "Bank Statement & FBR Advisory",
    desc: "Ensure tie-backs, tax filer status, and financial file readiness before submitting to consulates.",
  },
  {
    icon: MessageSquareCheck,
    iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    title: "Mock Interview Coaching",
    desc: "One-on-one preparation for US Embassy & European consulate interviews with verified visa officers.",
  },
];

export function VisaConsultationSection() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute left-1/4 top-1/2 -z-10 h-72 w-96 -translate-y-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 -z-10 h-72 w-96 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-b from-card via-card/95 to-card/90 p-6 shadow-2xl backdrop-blur-sm sm:p-10 lg:p-12">
        {/* Top subtle highlight bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column (7 cols): Copy & Value Props */}
          <div className="space-y-6 lg:col-span-7">
            {/* Urgency Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-400">
              <span className="flex size-2 rounded-full bg-rose-400 animate-ping" />
              <span>🚨 Struggling with Complex Embassy Rules or Past Rejection?</span>
            </div>

            {/* Power Title */}
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.18]">
                Visa Refused or Nervous About{" "}
                <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                  Embassy Approval?
                </span>
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Don't risk another rejection mark on your passport. Submit your case details
                to receive up to <strong className="text-foreground">5 competitive proposals</strong> from
                Pakistan's top verified visa consultants, appeal specialists, and legal advisors.
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/40 p-3.5 transition-all duration-200 hover:border-border hover:bg-surface/70"
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl border ${item.iconColor}`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-foreground">{item.title}</h4>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA & Trust Stats */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/custom-visa" as any })}
                className="group relative h-13 gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-8 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-rose-500/25"
              >
                <FileCheck2 className="size-5" />
                <span>Request Custom Visa Consultation</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>100% Confidential · Free to Submit</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Visual Trust Card & Process */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 shadow-card backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Visa Success Hub
                    </h4>
                    <p className="text-sm font-bold text-foreground">
                      How Custom Consultation Works
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  ⚡ Fast-Track
                </span>
              </div>

              {/* Steps */}
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-400 ring-1 ring-rose-500/30">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Submit Your Case Profile</p>
                    <p className="text-[11px] text-muted-foreground">
                      Select country (UK, Schengen, US, Turkey etc.), case nature (Fresh / Refusal) & submission city.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Receive Up to 5 Expert Bids</p>
                    <p className="text-[11px] text-muted-foreground">
                      Licensed consultants evaluate your case and send breakdown of fees, timelines & checklists.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Chat on WhatsApp & File Confidently</p>
                    <p className="text-[11px] text-muted-foreground">
                      Visit local office in Islamabad/Lahore/Karachi or proceed online with 100% peace of mind.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Countries Pill Bar */}
              <div className="mt-6 rounded-xl border border-border/70 bg-background/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Top Destinations Supported
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇬🇧 UK</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇪🇺 Schengen</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇺🇸 USA</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇨🇦 Canada</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇹🇷 Turkey</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇦🇪 UAE</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇸🇦 Saudi / Umrah</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 border border-border">🇦🇺 Australia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
