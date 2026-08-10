import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { registerAffiliate, getAffiliateSettings } from "@/lib/affiliate.functions";
import { TIERS } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Mountain, Share2, DollarSign, Users, CheckCircle2, ArrowRight,
  Star, Zap, BookOpen, ChevronDown, ChevronRight, Phone,
  Copy, ExternalLink, Loader2, Gift, TrendingUp, Target,
  MessageSquare, MapPin, Award, ShieldCheck, BadgeCheck, Video,
  Instagram, Youtube, Facebook, Camera, Send, Link2, X,
  HelpCircle, FileText, Info, Sparkles, Building2, Check, Tag,
  Code2, Layers, CheckSquare, Sparkle, Subtitles, Wrench
} from "lucide-react";

export const Route = createFileRoute("/become-affiliate")({
  component: BecomeAffiliatePage,
  head: () => ({
    meta: [
      { title: "Earn Money — GlobeTrek PK Affiliate Program" },
      { name: "description", content: "Become a GlobeTrek PK sales partner or social media creator. Earn 20% commission for every travel agency you bring to the platform. No targets. Unlimited earning." },
    ],
  }),
});

/* ── Social Media Promotion Guidelines per Platform ── */
const SOCIAL_GUIDELINES = [
  {
    platform: "YouTube Vloggers & Tech Reviewers",
    icon: Youtube,
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    action: "Make a 3-10 min video or Short showing GlobeTrek's B2B travel features & custom lead portal.",
    linkGuidance: "Put trackable bio link in the TOP line of description & pinned comment.",
    vendorHook: "Tell travel agents: 'Use code YOUR_CODE to get 10% off your first month'.",
  },
  {
    platform: "Instagram & TikTok Content Creators",
    icon: Instagram,
    color: "text-pink-500",
    bg: "bg-pink-500/5",
    border: "border-pink-500/20",
    action: "Post a Reel / TikTok demonstrating how Pakistani agencies list tours & collect PKR online.",
    linkGuidance: "Put trackable bio link (globetrek.pk/auth?mode=signup&ref=YOUR_CODE) in Instagram bio / linktree.",
    vendorHook: "Add text overlay in video: 'Travel agents use code YOUR_CODE for 10% Off'.",
  },
  {
    platform: "Facebook Travel Operator Groups",
    icon: Facebook,
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    action: "Share informative posts in Pakistan travel operator & Umrah agent Facebook groups.",
    linkGuidance: "Include signup link + referral code directly inside group post text.",
    vendorHook: "Highlight zero commission on bookings + free demo testing.",
  },
];

/* ── How to earn more tips ── */
const EARN_MORE = [
  { icon: MapPin, title: "Target busy markets", tip: "Visit Shah Alam Market (Lahore), Saddar (Karachi), and Blue Area (Islamabad) — these localities have the highest concentration of travel agencies in Pakistan." },
  { icon: Phone, title: "WhatsApp first, visit second", tip: "Send a WhatsApp message introducing GlobeTrek PK before visiting. Share the platform link. Warm visits convert 3x better than cold walk-ins." },
  { icon: Users, title: "Target the right agencies", tip: "Focus on mid-size agencies (5–15 staff) that already do online business. Solo agents or very large chains are harder to convert." },
  { icon: MessageSquare, title: "Use the GlobeTrek pitch script", tip: "Say: \"I'm partnered with GlobeTrek PK — a digital platform where travel agencies get verified leads, online bookings, and visa/insurance tools. First month is free. Can I show you a 5-minute demo?\"" },
  { icon: TrendingUp, title: "Stack referrals to earn more", tip: "There's no cap. Multiple signups stack up quickly. Mix all plans for maximum earnings. Your code works forever." },
  { icon: Gift, title: "Refer during Eid season", tip: "Travel agencies see the most business before Eid ul-Fitr and Eid ul-Adha. Agencies are more willing to invest in new tools during peak season (March–April, May–June)." },
  { icon: Award, title: "Target Hajj/Umrah operators", tip: "Umrah operators are always looking for leads and payment solutions. GlobeTrek's ticketing & visa modules are perfect for them." },
  { icon: Target, title: "Bring Full Agency clients", tip: "Pitching larger agencies to go Full Agency earns you the highest single commission — with maximum recurring value." },
];

/* ── FAQ ── */
const FAQ = [
  { q: "Do I need to be a travel expert?", a: "No. You just need to be able to talk to travel agents or post content explaining the platform's benefits to travel businesses." },
  { q: "How do social media creators get verified?", a: "After posting a video or Reel on YouTube/Instagram/Facebook, submit your link in your affiliate dashboard. Our team verifies the post within 24 hours." },
  { q: "When do I get paid?", a: "Every Friday. As soon as the vendor's payment is confirmed, your commission appears in your dashboard. We transfer via JazzCash or EasyPaisa every Friday." },
  { q: "Is there any target or quota?", a: "Zero. No monthly targets. You earn every time a vendor you brought in pays their subscription — whether that's 1 agency or 100." },
  { q: "What if a vendor upgrades or renews their plan?", a: "You earn commission whenever a vendor pays or upgrades! Vendors get 7-day, 3-day, and 24-hour expiration alerts via WhatsApp and email so they never miss a renewal." },
  { q: "How does the vendor enter my code?", a: "When the vendor signs up, they enter your referral code (e.g. REF-AHMED1234) or click your trackable bio link which pre-fills the code automatically." },
  { q: "What is the minimum payout?", a: "PKR 1,000. Once your earned balance hits PKR 1,000, you can request a payout from your affiliate dashboard." },
];

function BecomeAffiliatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const registerFn = useServerFn(registerAffiliate);
  const getSettingsFn = useServerFn(getAffiliateSettings);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", cnic: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [blueprintModal, setBlueprintModal] = useState<"field" | "social" | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["affiliate-settings"],
    queryFn: () => getSettingsFn(),
  });

  const commissionPct = settings?.commission_pct ?? 20;

  // Compute live plans dynamically from TIERS and commission_pct
  const paidTiers = TIERS.filter((t) => t.price_pkr > 0);
  const dynamicPlans = paidTiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price_pkr,
    commission: Math.round((t.price_pkr * commissionPct) / 100),
    archetype: t.archetype,
    popular: t.highlight,
    color: t.id === "agency" ? "text-amber-400" : t.id === "pro" ? "text-primary" : "text-sky-400",
    bg: t.id === "agency" ? "bg-amber-500/5" : t.id === "pro" ? "bg-primary/5" : "bg-sky-500/5",
    border: t.id === "agency" ? "border-amber-500/20" : t.id === "pro" ? "border-primary/20" : "border-sky-500/20",
  }));

  const minCommission = Math.min(...dynamicPlans.map((p) => p.commission));
  const maxCommission = Math.max(...dynamicPlans.map((p) => p.commission));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first", { description: "Create a free account or sign in to register as an affiliate." });
      navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    if (!form.fullName || !form.phone || !form.cnic || !form.city) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const result = await registerFn({
        data: {
          userId: user.id,
          fullName: form.fullName,
          phone: form.phone,
          cnic: form.cnic,
          city: form.city,
          email: user.email ?? "",
        },
      });
      if (result.already) {
        toast.info("You're already registered!", { description: `Your code: ${result.referral_code}` });
        setDone({ code: result.referral_code });
      } else {
        toast.success("Welcome to the Affiliate Program! 🎉");
        setDone({ code: result.referral_code });
      }
    } catch (err: any) {
      toast.error("Registration failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    toast.success("Template copied to clipboard!");
    setTimeout(() => setCopiedTemplate(null), 2500);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function scrollToRegister() {
    setBlueprintModal(null);
    const elem = document.getElementById("register");
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Mountain className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">GlobeTrek <span className="text-primary">PK</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/affiliate" className="text-xs text-muted-foreground hover:text-foreground transition">My Dashboard</Link>
            {!user && (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-violet-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Share2 className="size-3.5" /> Field Sales &amp; Content Creator Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Turn your network or content<br />into <span className="text-primary">real income</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            Promote GlobeTrek PK in-person or on social media. Earn <strong className="text-foreground">PKR {minCommission.toLocaleString()}–{maxCommission.toLocaleString()}</strong> ({commissionPct}% commission) for every travel agency that subscribes — paid directly to your JazzCash or EasyPaisa every Friday.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-bold rounded-2xl gap-2 text-base px-8"
              onClick={() => setShowForm(true)}
            >
              <BadgeCheck className="size-5" /> Register as Partner — Free
            </Button>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="rounded-2xl text-base px-8 gap-2">
                How it works <ArrowRight className="size-4" />
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {["No targets. No pressure.", "Trackable Bio Links & Codes", "Paid every Friday", "JazzCash / EasyPaisa"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-400" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2 WAYS TO EARN CARDS ── */}
      <section className="py-12 px-4 bg-surface/30 border-y border-border/40">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
              <DollarSign className="size-3.5" /> 2 Ways to Earn Money
            </div>
            <h2 className="text-2xl font-bold text-foreground">Choose How You Want to Promote</h2>
            <p className="text-sm text-muted-foreground mt-1">Click on any program below to view its complete step-by-step blueprint, scripts &amp; copy-paste templates!</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Field Sales Card */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 space-y-4 shadow-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <MapPin className="size-6" />
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary border border-primary/30">
                    IN-PERSON FIELD SALES
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Field Sales Partner</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Walk into travel agencies in your city (Shah Alam Market Lahore, Saddar Karachi, Blue Area Islamabad). Pitch GlobeTrek PK directly to agency directors and show them a live demo.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Give vendor your unique code (e.g. REF-AHMED1234) for 10% Off
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Earn PKR {minCommission.toLocaleString()}–{maxCommission.toLocaleString()} per agency closed
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Includes ready-made Roman Urdu pitch scripts &amp; objection handling
                  </li>
                </ul>
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => setBlueprintModal("field")}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-xl text-xs gap-1.5"
                >
                  <BookOpen className="size-3.5" /> How Field Sales Works (View Execution Guide)
                </Button>
                <a href="#register" className="block text-center text-[11px] text-muted-foreground hover:text-foreground underline">
                  Skip to Sign Up →
                </a>
              </div>
            </div>

            {/* Social Media Creator Card */}
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-6 space-y-4 shadow-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <Video className="size-6" />
                  </div>
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-[10px] font-bold text-violet-400 border border-violet-500/30">
                    ONLINE SOCIAL CREATOR
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Social Media Ambassador</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Promote GlobeTrek PK on YouTube, Instagram, TikTok, Facebook, or LinkedIn. Place your trackable bio link in your profile/description and submit video links for verification.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Trackable bio links (auto-saves referral for 30 days)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Earn PKR {minCommission.toLocaleString()}–{maxCommission.toLocaleString()} per online agency signup
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Includes copy-paste post templates &amp; verification portal
                  </li>
                </ul>
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => setBlueprintModal("social")}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs gap-1.5"
                >
                  <Video className="size-3.5" /> How Social Creation Works (View Execution Guide)
                </Button>
                <a href="#register" className="block text-center text-[11px] text-muted-foreground hover:text-foreground underline">
                  Skip to Sign Up →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC COMMISSION CARDS ── */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold mb-2">How much will you earn?</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Live {commissionPct}% commission on every vendor plan closed (aligned with GlobeTrek pricing).
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {dynamicPlans.map((p) => (
              <div key={p.id} className={cn("relative rounded-2xl border p-6 text-center space-y-2 flex flex-col justify-between", p.bg, p.border)}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Highest earning
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-3">PKR {p.price.toLocaleString()}/month</div>
                  <div className={cn("text-4xl font-black", p.color)}>PKR {p.commission.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">per successful signup ({commissionPct}%)</div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-3 italic">
                  {p.archetype}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Plus: earn again on <strong className="text-foreground">plan upgrades</strong>. If your referred agency upgrades tier, you earn the commission difference.
          </p>
        </div>
      </section>

      {/* ── CONTENT CREATOR & SOCIAL MEDIA AMBASSADOR GUIDE ── */}
      <section className="py-12 px-4 bg-surface/30">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-400 mb-2">
              <Video className="size-3.5" /> Content Creator &amp; Social Ambassador Guide
            </div>
            <h2 className="text-2xl font-bold text-foreground">How to Promote on Social Media</h2>
            <p className="text-sm text-muted-foreground mt-1">Step-by-step guidelines for YouTubers, Instagrammers, and Facebook creators</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {SOCIAL_GUIDELINES.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.platform} className={cn("rounded-2xl border p-5 space-y-3", g.bg, g.border)}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-5", g.color)} />
                    <span className="font-bold text-xs text-foreground">{g.platform}</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Action:</strong> {g.action}</p>
                    <p><strong className="text-foreground">Link Placement:</strong> {g.linkGuidance}</p>
                    <p><strong className="text-foreground">Vendor Discount Hook:</strong> {g.vendorHook}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Camera className="size-5 text-primary shrink-0" />
              <div>
                <span className="font-bold">Proof Verification Mechanism:</span> Submit your published video/post link in your affiliate dashboard. Admin verifies creator posts within 24 hours.
              </div>
            </div>
            <Link to="/affiliate">
              <Button size="sm" className="bg-primary text-primary-foreground font-bold text-xs rounded-xl shrink-0">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM & ENTERPRISE KNOWLEDGE CARDS ── */}
      <section className="py-12 px-4 bg-gradient-to-br from-primary/10 via-card to-card border-y border-primary/20">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
              <BookOpen className="size-3.5" /> Sales Partner Knowledge Hub
            </div>
            <h2 className="text-2xl font-bold text-foreground">Master the Platform Before You Pitch</h2>
            <p className="text-sm text-muted-foreground mt-1">Study our vendor guide and enterprise solutions so you can answer any travel agency's questions with confidence.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Vendor Guide Card */}
            <div className="rounded-2xl border border-primary/30 bg-card p-6 space-y-4 flex flex-col justify-between shadow-card hover:border-primary/60 transition">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <BookOpen className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Vendor Onboarding &amp; Feature Guide</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Understand how travel agencies list tours, receive customer leads, unlock traveler contact info, and use our AI itinerary generator. Essential reading for your sales pitch!
                </p>
                <ul className="space-y-1.5 text-xs text-foreground font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    How traveler lead credits &amp; unlocking work
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Safepay PKR payment gateway integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Storefront setup &amp; catalog management
                  </li>
                </ul>
              </div>
              <Link to="/vendor-guide" target="_blank">
                <Button size="sm" variant="outline" className="w-full font-bold rounded-xl text-xs gap-1.5 mt-2 border-primary/30 text-primary hover:bg-primary/10">
                  Read Vendor Guide <ExternalLink className="size-3.5" />
                </Button>
              </Link>
            </div>

            {/* Enterprise Solutions Card */}
            <div className="rounded-2xl border border-violet-500/30 bg-card p-6 space-y-4 flex flex-col justify-between shadow-card hover:border-violet-500/60 transition">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <Award className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Enterprise &amp; Large Agency Solutions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pitching a large travel chain, Umrah group operator, or multi-branch franchise network? Learn about custom SLA guarantees, multi-agent accounts, and white-label options.
                </p>
                <ul className="space-y-1.5 text-xs text-foreground font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Multi-branch team accounts &amp; role permissions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Custom lead routing &amp; priority placement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    Dedicated Account Manager &amp; 99.9% uptime SLA
                  </li>
                </ul>
              </div>
              <Link to="/enterprise" target="_blank">
                <Button size="sm" variant="outline" className="w-full font-bold rounded-xl text-xs gap-1.5 mt-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                  Explore Enterprise Solutions <ExternalLink className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-8">How it works — 4 simple steps</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "1", icon: BadgeCheck, title: "Register below", body: "Fill the form, get your unique referral code & trackable bio link instantly. e.g. REF-AHMED1234", color: "bg-primary/10 text-primary" },
              { step: "2", icon: Users, title: "Pitch or Post Online", body: "Visit travel agencies or post on YouTube/Instagram with your code and bio link.", color: "bg-violet-500/10 text-violet-400" },
              { step: "3", icon: Share2, title: "Vendor uses your code", body: "Agency signs up and enters your referral code (or clicks your bio link) for 10% off.", color: "bg-amber-500/10 text-amber-400" },
              { step: "4", icon: DollarSign, title: "You earn commission", body: `Earn PKR ${minCommission.toLocaleString()}–${maxCommission.toLocaleString()} credited instantly. Paid every Friday via JazzCash/EasyPaisa.`, color: "bg-emerald-500/10 text-emerald-400" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-border bg-card p-5">
                <div className={cn("size-10 rounded-xl flex items-center justify-center mb-3", s.color)}>
                  <s.icon className="size-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Step {s.step}</div>
                <div className="font-bold text-sm text-foreground mb-1.5">{s.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO EARN MORE ── */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">Tips to earn more</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">Strategies from top-performing partners.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {EARN_MORE.map((tip) => (
              <div key={tip.title} className="rounded-2xl border border-border bg-card p-4 flex gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <tip.icon className="size-3.5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground mb-0.5">{tip.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE PITCH SCRIPT ── */}
      <section className="py-12 px-4 bg-surface/30">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold mb-2">Your pitch script</h2>
          <p className="text-center text-xs text-muted-foreground mb-6">Use this when approaching travel agencies</p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 font-mono text-xs text-foreground leading-relaxed space-y-3">
            <p><span className="text-primary font-bold">YOU:</span> "Assalam-o-Alaikum, main aapko GlobeTrek PK ke baray mein batana chahta tha — yeh Pakistan ka pehla digital travel marketplace hai."</p>
            <p><span className="text-primary font-bold">YOU:</span> "Iss platform par aapki agency list hoti hai, aur verified customers seedha aapko contact kartay hain. Leads milti hain, payment online hoti hai, aur AI tools bhi hain tour descriptions likhnay ke liye."</p>
            <p><span className="text-primary font-bold">YOU:</span> "Travel Desk plan PKR 4,000/month aur Tour Operator plan PKR 7,500/month hai. Pehla mahina free demo kar saktay hain. Main aapko 5 minute mein poora platform dikha sakta hun?"</p>
            <div className="border-t border-primary/20 pt-3 mt-3">
              <p className="text-muted-foreground text-[10px]">If they say yes → Show them: globetrek.pk → login demo → features tour</p>
              <p className="text-muted-foreground text-[10px]">If they hesitate → "No commitment. Main aapko brochure chor ta hun aur WhatsApp number de ta hun."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground text-left"
                >
                  {openFaq === i ? <ChevronDown className="size-4 shrink-0 text-primary" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                  {f.q}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRATION FORM ── */}
      <section id="register" className="py-16 px-4 bg-surface/30">
        <div className="mx-auto max-w-md">
          {done ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="size-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">You're in! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6">Your unique referral code &amp; trackable bio link are ready. Share them with travel agencies or on social media.</p>
              <div className="rounded-xl border border-emerald-500/30 bg-background p-4 mb-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Referral Code</div>
                <div className="text-3xl font-black text-emerald-400 tracking-wider">{done.code}</div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => copyCode(done.code)}
                  variant="outline"
                  className="gap-1.5 text-xs rounded-xl"
                >
                  {copiedCode ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedCode ? "Copied!" : "Copy Code"}
                </Button>
                <Link to="/affiliate">
                  <Button className="gap-1.5 text-xs rounded-xl bg-primary text-primary-foreground font-bold">
                    <ExternalLink className="size-3.5" /> My Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="text-center mb-6">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <BadgeCheck className="size-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Register as Partner</h2>
                <p className="text-xs text-muted-foreground mt-1">Free. Instant code &amp; bio link. Start earning today.</p>
              </div>
              {!user && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 font-medium text-center mb-4">
                  You'll need to <Link to="/auth" className="underline">sign in</Link> first to register as an affiliate.
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name *</label>
                  <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Ahmed Khan" className="text-xs rounded-xl" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">WhatsApp / Mobile Number *</label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" className="text-xs rounded-xl" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">CNIC Number * (for payout identity)</label>
                  <Input value={form.cnic} onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))} placeholder="12345-1234567-1" className="text-xs rounded-xl" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">City *</label>
                  <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Lahore" className="text-xs rounded-xl" required />
                </div>
                <div className="pt-1">
                  <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 size-3.5 rounded border-border bg-surface text-primary focus:ring-primary shrink-0 accent-primary"
                    />
                    <span className="leading-snug">
                      I have read and agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary font-bold underline hover:text-primary/80">
                        GlobeTrek Partner &amp; Affiliate Terms
                      </Link>.
                    </span>
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-xl gap-2 mt-2"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                  {loading ? "Registering..." : "Get My Referral Code"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ── INTERACTIVE BLUEPRINT MODALS ── */}
      {blueprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            <button
              onClick={() => setBlueprintModal(null)}
              className="absolute top-5 right-5 grid size-8 place-items-center rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>

            {/* Field Sales Blueprint */}
            {blueprintModal === "field" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="size-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="size-6" />
                  </div>
                  <div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">IN-PERSON FIELD SALES BLUEPRINT</Badge>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">Field Sales Partner — Step-by-Step Action Guide</h2>
                  </div>
                </div>

                <div className="space-y-5 text-xs text-muted-foreground leading-relaxed">
                  {/* Step 1: Target Markets */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Target className="size-4 text-primary" /> Step 1: Target Locations &amp; Agency Profiles
                    </h4>
                    <p className="text-foreground font-medium">Walk into active travel agent hubs across Pakistan:</p>
                    <ul className="grid sm:grid-cols-2 gap-2 text-foreground font-medium pt-1">
                      <li className="bg-card p-2 rounded-xl border border-border">• <strong>Lahore:</strong> Shah Alam Market, McLeod Rd</li>
                      <li className="bg-card p-2 rounded-xl border border-border">• <strong>Karachi:</strong> Saddar, I.I. Chundrigar Rd</li>
                      <li className="bg-card p-2 rounded-xl border border-border">• <strong>Islamabad:</strong> Blue Area, F-7 Markaz</li>
                      <li className="bg-card p-2 rounded-xl border border-border">• <strong>Rawalpindi:</strong> Saddar, Murree Rd</li>
                    </ul>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      <strong>Best prospects:</strong> Mid-size agencies (5–15 staff) offering tours, visa filing, ticketing, or Umrah.
                    </p>
                  </div>

                  {/* Step 2: Walk-In Pitch Script & Live Demo */}
                  <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <MessageSquare className="size-4 text-emerald-400" /> Step 2: The Walk-In Pitch &amp; Live Mobile Demo
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(`Assalam-o-Alaikum Sir! Main GlobeTrek PK se aya hun — Pakistan ka pehla digital marketplace travel agencies ke liye. Humari website par agencies tour packages list karti hain aur verified customer leads direct WhatsApp par leti hain. Pehla month testing free hai, aur meray discount code se aapko 10% Off milega.`, "pitch-script")}
                        className="text-[10px] h-7 gap-1 rounded-xl"
                      >
                        {copiedTemplate === "pitch-script" ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        {copiedTemplate === "pitch-script" ? "Copied Script!" : "Copy Script"}
                      </Button>
                    </div>
                    <div className="font-mono text-[11px] text-foreground bg-background rounded-xl p-3 border border-border space-y-2">
                      <p><span className="text-primary font-bold">YOU:</span> "Assalam-o-Alaikum Sir! Main GlobeTrek PK se aya hun — Pakistan ka pehla B2B travel marketplace."</p>
                      <p><span className="text-primary font-bold">YOU:</span> "Aap ki agency listings aur tours yahan publish hongay. Customers verified leads WhatsApp par bhejain gay, aur AI tool se 1 minute mein tour itineraries ban jati hain."</p>
                      <p><span className="text-primary font-bold">YOU:</span> "Main aapko apnay phone par 2 minute ki live demo dikhata hun?"</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 space-y-1 text-foreground">
                      <div className="font-bold text-[11px] text-primary flex items-center gap-1.5">
                        <Wrench className="size-3.5" /> Mobile Phone Demo Checklist (What to show on your phone):
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Open <strong className="text-primary">globetrek.pk</strong> on your browser.</li>
                        <li>Show tour packages catalog &amp; visa services portal.</li>
                        <li>Show the "Get Quotes / Unlock Customer Lead" button.</li>
                        <li>Show how the vendor gets 10% OFF by entering your referral code at signup.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Step 3: Objection Handling */}
                  <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <HelpCircle className="size-4 text-amber-400" /> Step 3: Agency Objection Handling
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="rounded-xl bg-card p-2.5 border border-border space-y-1">
                        <span className="font-bold text-foreground block">Q: "Hum to Facebook pages se leads latay hain?"</span>
                        <span className="text-muted-foreground block">A: "Facebook ads PKR 30,000/mo letay hain aur boht sari fake inquiries hoti hain. GlobeTrek verified travel leads deta hai aur 100% PKR native system hai."</span>
                      </div>
                      <div className="rounded-xl bg-card p-2.5 border border-border space-y-1">
                        <span className="font-bold text-foreground block">Q: "Is payment processed in PKR?"</span>
                        <span className="text-muted-foreground block">A: "Yes! Fully integrated with Safepay (Pakistani debit/credit cards &amp; online banking)."</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Live Earnings */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <DollarSign className="size-4 text-emerald-400" /> Step 4: Live Earnings ({commissionPct}% Commission) &amp; Friday Payouts
                    </h4>
                    <p>
                      When the vendor completes payment with your code (<strong className="text-primary">REF-CODE</strong>), your commission is credited instantly:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 font-bold">
                      {dynamicPlans.map((p) => (
                        <div key={p.id} className="rounded-xl border border-border bg-card p-2">
                          <span className="text-[10px] text-muted-foreground block truncate">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal block">PKR {p.price.toLocaleString()}</span>
                          <span className={cn("text-sm", p.color)}>PKR {p.commission.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Transferred automatically every Friday via JazzCash, EasyPaisa, or Bank Transfer.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={scrollToRegister}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-2xl py-3 text-sm gap-2"
                >
                  Understood! Proceed to Free Registration <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {/* Social Media Blueprint */}
            {blueprintModal === "social" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="size-12 rounded-2xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                    <Video className="size-6" />
                  </div>
                  <div>
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">SOCIAL CREATOR BLUEPRINT</Badge>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">Social Media Ambassador — Copy-Paste Templates &amp; Verification Guide</h2>
                  </div>
                </div>

                <div className="space-y-5 text-xs text-muted-foreground leading-relaxed">
                  {/* Step 1: Trackable Bio Link */}
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Link2 className="size-4 text-violet-400" /> Step 1: Bio Link &amp; 30-Day Tracking Cookie
                    </h4>
                    <p>
                      Your trackable bio link: <strong className="text-foreground">https://globetrek.pk/auth?mode=signup&amp;ref=YOUR_CODE</strong>.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      When a travel agency clicks your link, your referral code is stored in their browser cookie for 30 days. Even if they sign up weeks later, you get full credit!
                    </p>
                  </div>

                  {/* Step 2: Copy-Paste Templates */}
                  <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-4">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Code2 className="size-4 text-red-500" /> Step 2: Copy-Paste Content Templates per Platform
                    </h4>

                    {/* YouTube Template */}
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Youtube className="size-4 text-red-500" /> YouTube Title &amp; Description Template
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyText(`Title: How Pakistani Travel Agencies Get More Customers in 2026 — GlobeTrek PK Review\n\n👉 Travel Agencies Sign Up Here (10% Off First Month):\nhttps://globetrek.pk/auth?mode=signup&ref=YOUR_CODE\n\nUse Promo Code: YOUR_CODE for 10% Discount at checkout!`, "yt-template")}
                          className="text-[10px] h-7 gap-1 rounded-xl"
                        >
                          {copiedTemplate === "yt-template" ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedTemplate === "yt-template" ? "Copied!" : "Copy Description"}
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] bg-background p-2.5 rounded-lg border border-border text-foreground space-y-1">
                        <p><strong className="text-primary">Recommended Title:</strong> How Pakistani Travel Agencies Get More Customers in 2026 — GlobeTrek PK Review</p>
                        <p><strong className="text-primary">Description Line 1:</strong> 👉 Travel Agencies Sign Up Here (10% Off): https://globetrek.pk/auth?mode=signup&amp;ref=YOUR_CODE</p>
                        <p><strong className="text-primary">Pinned Comment:</strong> Use promo code <span className="text-amber-400 font-bold">YOUR_CODE</span> to save 10% on your agency subscription!</p>
                      </div>
                    </div>

                    {/* Instagram/TikTok Reel Template */}
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Instagram className="size-4 text-pink-500" /> Instagram / TikTok Reel &amp; Bio Template
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyText(`Travel Agents in Pakistan: List your tour packages & get verified customer leads on GlobeTrek PK!\n\n🔥 Use Code: YOUR_CODE for 10% Off\n👉 Click link in bio to register!\n\n#GlobeTrekPK #PakistanTravelAgencies #TourOperatorsPakistan #TravelPakistan #UmrahAgents`, "ig-template")}
                          className="text-[10px] h-7 gap-1 rounded-xl"
                        >
                          {copiedTemplate === "ig-template" ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedTemplate === "ig-template" ? "Copied!" : "Copy Reel Text"}
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] bg-background p-2.5 rounded-lg border border-border text-foreground space-y-1">
                        <p><strong className="text-violet-400">On-Screen Video Text:</strong> "Pakistani Travel Agents: Use code YOUR_CODE for 10% Off on GlobeTrek PK"</p>
                        <p><strong className="text-violet-400">Hashtags:</strong> #GlobeTrekPK #PakistanTravelAgencies #TourOperatorsPakistan #UmrahAgents</p>
                      </div>
                    </div>

                    {/* Facebook Group Post */}
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Facebook className="size-4 text-blue-500" /> Facebook Group B2B Post Template
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyText(`Assalam-o-Alaikum travel agency owners! If you want verified customer leads for tours, visa filing, and Umrah packages, check out GlobeTrek PK.\n\nRegister your agency here (Use code YOUR_CODE for 10% Off):\nhttps://globetrek.pk/auth?mode=signup&ref=YOUR_CODE`, "fb-template")}
                          className="text-[10px] h-7 gap-1 rounded-xl"
                        >
                          {copiedTemplate === "fb-template" ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedTemplate === "fb-template" ? "Copied!" : "Copy FB Post"}
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] bg-background p-2.5 rounded-lg border border-border text-foreground">
                        "Assalam-o-Alaikum travel agency owners! Register your agency on GlobeTrek PK for verified traveler leads. Use code YOUR_CODE for 10% Off: https://globetrek.pk/auth?mode=signup&amp;ref=YOUR_CODE"
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Proof Submission Engine */}
                  <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Camera className="size-4 text-amber-400" /> Step 3: Proof Submission &amp; 24-Hr Verification Engine
                    </h4>
                    <p>
                      After publishing your video or social post:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-foreground font-medium">
                      <li>Copy your published video/post URL.</li>
                      <li>Go to your <strong className="text-primary">/affiliate</strong> dashboard → open <strong className="text-violet-400">Social Media Kit</strong>.</li>
                      <li>Paste the post URL and click "Submit for Verification".</li>
                      <li>Admin verifies your creator post within 24 hours. Verified posts unlock top payout priority!</li>
                    </ol>
                  </div>

                  {/* Step 4: Live Earnings */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <DollarSign className="size-4 text-emerald-400" /> Step 4: Live Earnings ({commissionPct}% Commission) &amp; Friday Payouts
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 font-bold">
                      {dynamicPlans.map((p) => (
                        <div key={p.id} className="rounded-xl border border-border bg-card p-2">
                          <span className="text-[10px] text-muted-foreground block truncate">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal block">PKR {p.price.toLocaleString()}</span>
                          <span className={cn("text-sm", p.color)}>PKR {p.commission.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      All earnings are paid out every Friday via JazzCash, EasyPaisa, or Bank Transfer.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={scrollToRegister}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl py-3 text-sm gap-2"
                >
                  Understood! Proceed to Free Registration <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GlobeTrek PK · <Link to="/" className="hover:text-foreground">Back to Home</Link> ·{" "}
        <Link to="/affiliate" className="hover:text-foreground">Affiliate Dashboard</Link>
      </footer>
    </div>
  );
}
