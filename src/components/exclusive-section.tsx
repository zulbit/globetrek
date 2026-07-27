import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Users, MapPin, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import exclusiveBg from "@/assets/exclusive-tour-bg.png";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Itinerary",
    desc: "Get a full day-by-day plan in seconds",
  },
  {
    icon: Users,
    title: "Group-Friendly",
    desc: "Perfect for families, friends & corporates",
  },
  {
    icon: MapPin,
    title: "Any Destination",
    desc: "Turkey, Europe, Dubai, Thailand & more",
  },
  {
    icon: Shield,
    title: "Verified Experts",
    desc: "Receive quotes from vetted Pakistani agencies",
  },
];

export function ExclusiveSection() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      {/* Section header */}
      <div className="mb-10 space-y-1 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Premium Feature
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Custom tour builder
        </h2>
      </div>

      {/* Main card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid lg:grid-cols-2">
          {/* Left: Content side */}
          <div className="relative z-10 flex flex-col justify-center gap-8 p-8 sm:p-10 lg:p-14">
            {/* Badge */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
              <span className="text-base leading-none">👑</span>
              Exclusive Group &amp; Custom Packages
            </span>

            {/* Headline */}
            <div className="space-y-4">
              <h3 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                <span className="text-primary">🌴</span> Plan an Exclusive
                <br className="hidden sm:block" />
                Tour for{" "}
                <span className="bg-gradient-to-r from-primary to-highlight bg-clip-text text-transparent">
                  Family &amp; Friends
                </span>
              </h3>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Build your dream custom itinerary with AI in seconds, and
                receive competitive quotes directly from Pakistan's top verified
                travel experts.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface/50 p-3.5 transition-colors hover:border-primary/30 hover:bg-surface"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <f.icon className="size-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight">
                      {f.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/custom-tour" })}
                className="group/btn relative h-13 gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-indigo-500 to-highlight px-8 text-sm font-bold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Build Your Custom Tour
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </span>
                {/* Shimmer effect */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Free to submit · No obligation
              </span>
            </div>
          </div>

          {/* Right: Image side */}
          <div className="relative hidden min-h-[480px] lg:block">
            <img
              src={exclusiveBg}
              alt="Family enjoying a scenic viewpoint"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {/* Subtle edge blend only — keeps image crisp */}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent w-1/3" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/80 to-transparent" />

            {/* Floating stat cards */}
            <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3">
              <FloatingStat
                value="120+"
                label="Verified travel vendors"
                accent="primary"
              />
              <FloatingStat
                value="24hrs"
                label="Avg. quote response time"
                accent="highlight"
              />
              <FloatingStat
                value="100%"
                label="Free · No hidden costs"
                accent="primary"
              />
            </div>
          </div>
        </div>

        {/* Mobile image strip (visible on small screens) */}
        <div className="relative h-48 overflow-hidden lg:hidden">
          <img
            src={exclusiveBg}
            alt="Family enjoying a scenic viewpoint overlooking Mediterranean coast"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          {/* Mobile stats row */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 px-4 pb-4">
            <MobileStat value="120+" label="Vendors" />
            <MobileStat value="24hrs" label="Avg. Quote" />
            <MobileStat value="Free" label="No Hidden Cost" />
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-highlight/5 blur-3xl transition-all group-hover:bg-highlight/10 lg:hidden" />
      </div>
    </section>
  );
}

function FloatingStat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: "primary" | "highlight";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-lg backdrop-blur-xl">
      <span
        className={`font-display text-xl font-bold ${accent === "primary" ? "text-primary" : "text-highlight"}`}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function MobileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-center backdrop-blur-xl">
      <p className="text-sm font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
