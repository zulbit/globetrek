import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Mountain, Loader2, Newspaper, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import turkey from "@/assets/tour-turkey.jpg";
import thailand from "@/assets/tour-thailand.jpg";
import europe from "@/assets/tour-europe.jpg";
import dubai from "@/assets/tour-dubai.jpg";
import singapore from "@/assets/tour-singapore.jpg";
import vietnam from "@/assets/tour-vietnam.jpg";
import uk from "@/assets/tour-uk.jpg";
import malaysia from "@/assets/tour-malaysia.jpg";

type Search = {
  redirect?: string;
  mode?: "signin" | "signup";
  role?: "customer" | "vendor";
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "signup" ? "signup" : "signin",
    role: s.role === "vendor" ? "vendor" : "customer",
  }),
  head: () => ({
    meta: [
      { title: "Sign in · GlobeTrek PK" },
      { name: "description", content: "Sign in or register as a traveler or verified travel vendor on GlobeTrek PK." },
    ],
  }),
  component: AuthPage,
});

type Slide = {
  name: string;
  image: string;
  tag: string;
  headline: string;
  blurb: string;
};

const SLIDES: Slide[] = [
  {
    name: "Turkey",
    image: turkey,
    tag: "Istanbul · Cappadocia",
    headline: "Türkiye extends e-visa on arrival for Pakistani groups",
    blurb: "New multi-city itineraries bundle Bosphorus cruises with Cappadocia balloon flights this season.",
  },
  {
    name: "Thailand",
    image: thailand,
    tag: "Phuket · Krabi",
    headline: "Thailand keeps visa-free entry for Pakistani travelers",
    blurb: "Phuket and Krabi resorts drop shoulder-season rates — ideal for October honeymoon windows.",
  },
  {
    name: "UAE",
    image: dubai,
    tag: "Dubai · Abu Dhabi",
    headline: "Dubai unveils new desert-to-skyline weekend routes",
    blurb: "60-hour Dubai breaks from KHI now include Museum of the Future and Al Marmoom stargazing.",
  },
  {
    name: "Europe",
    image: europe,
    tag: "Schengen · Multi-city",
    headline: "Schengen appointment slots open earlier for winter 2026",
    blurb: "Vendors report faster France and Italy turnarounds — Christmas market itineraries filling fast.",
  },
  {
    name: "Singapore",
    image: singapore,
    tag: "Marina Bay · Sentosa",
    headline: "Singapore Airlines adds direct LHE seasonal service",
    blurb: "Family bundles pair Universal Studios with Gardens by the Bay night shows.",
  },
  {
    name: "Vietnam",
    name: "Vietnam",
    image: vietnam,
    tag: "Hanoi · Ha Long",
    headline: "Vietnam eases e-visa to 90 days for Pakistani passports",
    blurb: "Ha Long Bay cruises and Sapa treks stay under ₨ 250,000 across shoulder season.",
  },
  {
    name: "Malaysia",
    image: malaysia,
    tag: "Kuala Lumpur · Langkawi",
    headline: "Malaysia extends visa-free travel through 2026",
    blurb: "KL + Langkawi twin-center packages are the top-selling honeymoon combo of the quarter.",
  },
  {
    name: "United Kingdom",
    image: uk,
    tag: "London · Edinburgh",
    headline: "UK trims standard visit-visa wait times for Pakistan",
    blurb: "Summer London and Highlands itineraries are opening two months earlier than last year.",
  },
];

import { getStoredReferralCode } from "@/components/vendor-ref-handler";

function AuthPage() {
  const { mode = "signin", role: initialRole = "customer", redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<"signin" | "signup">(mode);
  const [loading, setLoading] = React.useState(false);
  const [slide, setSlide] = React.useState(0);

  // shared
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // signup
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState<"customer" | "vendor">(initialRole);
  const [companyName, setCompanyName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [referralCode, setReferralCode] = React.useState(() => getStoredReferralCode() || "");
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  React.useEffect(() => {
    if (mode) setTab(mode);
    if (initialRole) setRole(initialRole);
  }, [mode, initialRole]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: (redirect as never) ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Invalid credentials");
      return;
    }
    toast.success("Welcome back");
    navigate({ to: (redirect as never) ?? "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error("Please accept the Terms of Service & Ecosystem Policies to proceed.");
      return;
    }
    if (role === "vendor") {
      if (!companyName.trim()) {
        toast.error("Company name is required for vendors");
        return;
      }
      if (!phone.trim()) {
        toast.error("Mobile / WhatsApp number is required for vendors");
        return;
      }
    }
    setLoading(true);

    try {
      // Call server endpoint that uses Supabase Admin API with email_confirm: true
      // This bypasses email sending completely and eliminates Supabase rate limits!
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          company_name: role === "vendor" ? companyName : null,
          phone: role === "vendor" ? phone : null,
          referral_code: role === "vendor" && referralCode.trim() ? referralCode.trim().toUpperCase() : null,
        }),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        setLoading(false);
        toast.error(resData.error || "Sign up failed");
        return;
      }

      // Automatically sign in the user now that the account is created and auto-confirmed
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (loginErr) {
        toast.error(`Account created! Please sign in: ${loginErr.message}`);
        setTab("signin");
        return;
      }

      toast.success("Account created successfully — Welcome!");
      navigate({ to: (redirect as never) ?? "/dashboard" });
    } catch (err: any) {
      setLoading(false);
      toast.error(`Registration error: ${err.message || "Unknown error"}`);
    }
  }

  const active = SLIDES[slide];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Carousel backdrop */}
      <div className="pointer-events-none absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={s.name}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
            style={{ opacity: i === slide ? 1 : 0 }}
            aria-hidden="true"
          >
            <img
              src={s.image}
              alt=""
              className="h-full w-full object-cover"
              style={{ transform: i === slide ? "scale(1.06)" : "scale(1)", transition: "transform 6s ease-out" }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16 lg:py-16">
        {/* Left: brand + news */}
        <div className="hidden flex-col justify-between lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 backdrop-blur">
              <Mountain className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              GlobeTrek <span className="text-primary">PK</span>
            </span>
          </Link>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <MapPin className="size-3.5 text-primary" />
              <span className="tracking-wide">{active.tag}</span>
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg">
              Discover {active.name}.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/80">
              Priced in PKR by verified Pakistani vendors. Sign in to save trips, unlock inquiries and manage your listings.
            </p>

            {/* News card */}
            <div className="mt-8 max-w-lg rounded-2xl border border-white/10 bg-black/40 p-5 shadow-card backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                <Newspaper className="size-3.5" /> Travel wire · {active.name}
              </div>
              <p className="mt-3 text-base font-semibold leading-snug text-white">{active.headline}</p>
              <p className="mt-2 text-sm text-white/70">{active.blurb}</p>
            </div>

            {/* Slide dots */}
            <div className="mt-6 flex items-center gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSlide(i)}
                  aria-label={`Show ${s.name}`}
                  className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-primary" : "w-3 bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">© {new Date().getFullYear()} GlobeTrek PK · The world, in PKR.</p>
        </div>

        {/* Right: auth card */}
        <div className="flex flex-col justify-center">
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Mountain className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">
              GlobeTrek <span className="text-primary">PK</span>
            </span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-card backdrop-blur-2xl sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-white/5 p-1 text-sm ring-1 ring-white/10">
              <button
                onClick={() => setTab("signin")}
                className={`h-9 rounded-md font-medium transition ${tab === "signin" ? "bg-primary text-primary-foreground shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Sign in
              </button>
              <button
                onClick={() => setTab("signup")}
                className={`h-9 rounded-md font-medium transition ${tab === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Create account
              </button>
            </div>

            {tab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
                  <p className="mt-1 text-sm text-white/60">Sign in to continue planning your next trip.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" />
                </div>
                <Button disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Sign in
                </Button>

                {/* Quick Demo Credentials Assistant */}
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    💡 Quick Fill Demo Accounts (Use Sign In Tab)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("signin");
                        setEmail("customer.demo@globetrek.pk");
                        setPassword("customer123");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/40 p-2 text-center transition hover:border-sky-500/50 hover:bg-sky-500/10"
                    >
                      <span className="text-[11px] font-bold text-sky-400">Customer</span>
                      <span className="text-[9px] text-white/50 truncate w-full">customer.demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTab("signin");
                        setEmail("vendor.demo@globetrek.pk");
                        setPassword("vendor123");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/40 p-2 text-center transition hover:border-emerald-500/50 hover:bg-emerald-500/10"
                    >
                      <span className="text-[11px] font-bold text-emerald-400">Vendor</span>
                      <span className="text-[9px] text-white/50 truncate w-full">vendor.demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTab("signin");
                        setEmail("admin.demo@globetrek.pk");
                        setPassword("admin123");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/40 p-2 text-center transition hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      <span className="text-[11px] font-bold text-purple-400">Admin</span>
                      <span className="text-[9px] text-white/50 truncate w-full">admin.demo</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">Create your account</h1>
                  <p className="mt-1 text-sm text-white/60">Traveler or verified vendor — pick your path.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Are you a…</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as "customer" | "vendor")}
                    className="grid grid-cols-2 gap-2"
                  >
                    <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 ${role === "customer" ? "border-primary/60 ring-1 ring-primary/40" : ""}`}>
                      <RadioGroupItem value="customer" /> Traveler
                    </label>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 ${role === "vendor" ? "border-primary/60 ring-1 ring-primary/40" : ""}`}>
                      <RadioGroupItem value="vendor" /> Travel Vendor
                    </label>
                  </RadioGroup>
                  <p className="text-[11px] text-white/50 pt-0.5">
                    Want to earn commission? Register as a <strong>Traveler</strong> first, then join our{" "}
                    <Link to="/become-affiliate" className="text-primary hover:underline font-bold">
                      Affiliate Program
                    </Link>.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white/80">Full name</Label>
                  <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" />
                </div>

                {role === "vendor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-white/80">Agency / Company name*</Label>
                      <Input id="company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" placeholder="e.g. Skylark Travels & Tours" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80">Mobile / WhatsApp Number*</Label>
                      <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" placeholder="e.g. +92 300 1234567" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref_code" className="text-white/80">Referral Code <span className="text-white/40">(optional)</span></Label>
                      <Input id="ref_code" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="bg-white/5 text-white placeholder:text-white/40 font-mono tracking-widest" placeholder="e.g. REF-AHMED1234" />
                      <p className="text-[10px] text-white/40">Were you introduced by a GlobeTrek Sales Partner? Enter their code.</p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email2" className="text-white/80">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2" className="text-white/80">Password</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 text-white placeholder:text-white/40" />
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-white/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary shrink-0 accent-primary"
                    />
                    <span className="leading-snug">
                      I have read and agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary font-bold underline hover:text-primary/80">
                        Terms of Service &amp; Ecosystem Policies
                      </Link>.
                    </span>
                  </label>
                </div>

                <Button disabled={loading || !acceptTerms} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Create account
                </Button>
                {role === "vendor" && (
                  <p className="text-xs text-white/60">
                    Vendor accounts start as <span className="text-highlight">pending</span> until approved by a platform admin.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Mobile news card */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 shadow-card backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
              <Newspaper className="size-3" /> {active.name} · {active.tag}
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-white">{active.headline}</p>
            <p className="mt-1 text-xs text-white/70">{active.blurb}</p>
            <div className="mt-3 flex items-center gap-1.5">
              {SLIDES.map((s, i) => (
                <span key={s.name} className={`h-1 rounded-full transition-all ${i === slide ? "w-6 bg-primary" : "w-2 bg-white/25"}`} />
              ))}
            </div>
          </div>

          <Link to="/" className="mt-6 text-center text-xs text-white/60 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
