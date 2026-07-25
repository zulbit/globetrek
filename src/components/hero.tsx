import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Compass, Search, ShieldCheck } from "lucide-react";
import heroCappadocia from "@/assets/hero-cappadocia.jpg";
import heroWorld from "@/assets/hero-world.jpg";
import tourDubai from "@/assets/tour-dubai.jpg";
import tourThailand from "@/assets/tour-thailand.jpg";
import tourEurope from "@/assets/tour-europe.jpg";
import tourTurkey from "@/assets/tour-turkey.jpg";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DESTINATIONS, TOUR_TYPES, formatPKR } from "@/lib/tours";

const SLIDES = [
  { src: heroCappadocia, alt: "Hot air balloons at sunrise over Cappadocia, Turkey", label: "Cappadocia · Turkey" },
  { src: tourThailand, alt: "Tropical islands of Thailand", label: "Phuket · Thailand" },
  { src: tourDubai, alt: "Dubai skyline at dusk", label: "Dubai · UAE" },
  { src: tourEurope, alt: "European old town streets", label: "Rome · Europe" },
  { src: tourTurkey, alt: "Bosphorus in Istanbul", label: "Istanbul · Turkey" },
  { src: heroWorld, alt: "World traveler viewpoint", label: "The world · in PKR" },
];

export function Hero() {
  const navigate = useNavigate();
  const [destination, setDestination] = React.useState<string>("any");
  const [type, setType] = React.useState<string>("any");
  const [budget, setBudget] = React.useState<[number, number]>([100000, 900000]);
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    navigate({
      to: "/tours",
      search: {
        destination: destination === "any" ? undefined : destination,
        type: type === "any" ? undefined : type,
        min: budget[0],
        max: budget[1],
      } as never,
    });
  };

  return (
    <section className="relative -mt-px w-full">
      <div className="relative min-h-[100svh] w-full overflow-hidden">
        {/* Cinematic backdrop carousel */}
        <div className="absolute inset-0">
          {SLIDES.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={1920}
              height={1080}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-out ${
                i === slide ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
              style={{ transitionProperty: "opacity, transform", transitionDuration: i === slide ? "1500ms, 7000ms" : "1500ms, 0ms" }}
            />
          ))}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/60 via-transparent to-transparent" />

        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end gap-8 px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">

          {/* Copy */}
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
              <ShieldCheck className="size-3.5" />
              Verified vendors · All-in PKR pricing
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore the world <br className="hidden sm:block" />
              <span className="text-primary">from Pakistan.</span>
            </h1>
            <p className="max-w-xl text-base text-zinc-200 sm:text-lg">
              Curated international tour packages for the modern Pakistani traveler —
              Turkey, Thailand, UAE, Europe and beyond, priced transparently in PKR.
            </p>
          </div>

          {/* Search card — glassmorphism */}
          <div className="w-full max-w-5xl rounded-2xl border border-border bg-card/70 p-4 shadow-card backdrop-blur-xl sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1.4fr_auto] lg:items-end">
              <Field label="Destination" icon={<MapPin className="size-3.5" />}>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-11 border-border bg-surface">
                    <SelectValue placeholder="Any destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any destination</SelectItem>
                    {DESTINATIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tour type" icon={<Compass className="size-3.5" />}>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-11 border-border bg-surface">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {TOUR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Budget"
                icon={<span className="text-xs font-semibold text-highlight">₨</span>}
                trailing={
                  <span className="text-xs tabular-nums text-highlight">
                    {formatPKR(budget[0])} — {formatPKR(budget[1])}
                  </span>
                }
              >
                <div className="flex h-11 items-center rounded-md border border-border bg-surface px-3">
                  <Slider
                    value={budget}
                    min={100000}
                    max={1000000}
                    step={10000}
                    minStepsBetweenThumbs={1}
                    onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])}
                  />
                </div>
              </Field>

              <Button
                size="lg"
                onClick={submit}
                className="h-11 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
              >
                <Search className="size-4" />
                Search tours
              </Button>
            </div>
          </div>

          {/* Trust stats + carousel indicator */}
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/10 pt-5 text-xs text-zinc-300">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Stat k="120+" v="verified vendors" />
              <Stat k="4.9★" v="avg. package rating" />
              <Stat k="0%" v="hidden FX fees" />
              <Stat k="24/7" v="concierge support" />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                {SLIDES[slide].label}
              </span>
              <div className="flex items-center gap-1.5">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.src}
                    aria-label={`Show ${s.label}`}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slide ? "w-6 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function Field({
  label, icon, trailing, children,
}: { label: string; icon?: React.ReactNode; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        {trailing}
      </span>
      {children}
    </label>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-sm font-semibold text-white">{k}</span>
      <span className="text-zinc-400">{v}</span>
    </span>
  );
}
