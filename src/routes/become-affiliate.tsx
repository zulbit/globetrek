import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { registerAffiliate } from "@/lib/affiliate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Mountain, Share2, DollarSign, Users, CheckCircle2, ArrowRight,
  Star, Zap, BookOpen, ChevronDown, ChevronRight, Phone,
  Copy, ExternalLink, Loader2, Gift, TrendingUp, Target,
  MessageSquare, MapPin, Award, ShieldCheck, BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/become-affiliate")({
  component: BecomeAffiliatePage,
  head: () => ({
    meta: [
      { title: "Earn Money — GlobeTrek PK Affiliate Program" },
      { name: "description", content: "Become a GlobeTrek PK sales affiliate. Earn PKR 600–2,000 for every travel agency you bring to the platform. No targets. Unlimited earning." },
    ],
  }),
});

/* ── Commission tiers display ── */
const PLANS = [
  { name: "Starter Plan", price: 3000, commission: 600, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  { name: "Pro Plan", price: 10000, commission: 2000, color: "text-violet-400", bg: "bg-violet-500/5", border: "border-violet-500/20", popular: true },
];

/* ── How to earn more tips ── */
const EARN_MORE = [
  { icon: MapPin, title: "Target busy markets", tip: "Visit Shah Alam Market (Lahore), Saddar (Karachi), and Blue Area (Islamabad) — these localities have the highest concentration of travel agencies in Pakistan." },
  { icon: Phone, title: "WhatsApp first, visit second", tip: "Send a WhatsApp message introducing GlobeTrek PK before visiting. Share the platform link. Warm visits convert 3x better than cold walk-ins." },
  { icon: Users, title: "Target the right agencies", tip: "Focus on mid-size agencies (5–15 staff) that already do online business. Solo agents or very large chains are harder to convert." },
  { icon: MessageSquare, title: "Use the GlobeTrek pitch script", tip: "Say: \"I'm partnered with GlobeTrek PK — a digital platform where travel agencies get verified leads, online bookings, and visa/insurance tools. First month is free. Can I show you a 5-minute demo?\"" },
  { icon: TrendingUp, title: "Stack referrals to earn more", tip: "There's no cap. 10 Starter signups/month = PKR 6,000. 5 Pro signups = PKR 10,000. Mix both for maximum earnings. Your code works forever." },
  { icon: Gift, title: "Refer during Eid season", tip: "Travel agencies see the most business before Eid ul-Fitr and Eid ul-Adha. Agencies are more willing to invest in new tools during peak season (March–April, May–June)." },
  { icon: Award, title: "Target Hajj/Umrah operators", tip: "Umrah operators are always looking for leads and payment solutions. GlobeTrek's ticketing module is perfect for them. Commission on Pro plan = PKR 2,000 each." },
  { icon: Target, title: "Bring Pro-tier clients", tip: "Instead of signing up 10 Starter clients (PKR 6,000), convincing just 3 agencies to go Pro earns you PKR 6,000 — with less effort. Focus pitch on ROI of the Pro features." },
];

/* ── FAQ ── */
const FAQ = [
  { q: "Do I need to be a travel expert?", a: "No. You just need to be able to talk to travel agents and explain the platform's benefits. We provide you with ready-made pitch materials and a demo script." },
  { q: "When do I get paid?", a: "Every Friday. As soon as the vendor's payment is confirmed, your commission appears in your dashboard. You request payout and we transfer via JazzCash or EasyPaisa by Friday of that week." },
  { q: "Is there any target or quota?", a: "Zero. No monthly targets. You earn every time a vendor you brought in pays their subscription — whether that's 1 agency or 100." },
  { q: "What if a vendor upgrades their plan later?", a: "You earn a commission on the upgrade too! If your referred agency upgrades from Starter to Pro, you get 20% of the Pro plan value." },
  { q: "How does the vendor enter my code?", a: "When the vendor signs up or goes to the billing page, there's a field: \"Referred by a GlobeTrek Sales Partner? Enter code\". They type your unique code (e.g. REF-AHMED1234)." },
  { q: "What is the minimum payout?", a: "PKR 1,000. Once your earned balance hits PKR 1,000, you can request a payout from your affiliate dashboard." },
  { q: "Can I do this from any city?", a: "Yes. GlobeTrek is a national platform. Affiliates in Lahore, Karachi, Islamabad, Peshawar, Quetta, Multan — all cities welcome." },
];

/* ── Platform Feature Cards (guide) ── */
const PLATFORM_FEATURES = [
  { icon: Star, title: "What is GlobeTrek PK?", body: "GlobeTrek PK is Pakistan's first B2B digital travel marketplace. Travel agencies, visa consultants, insurance brokers, and ticketing desks list their services and receive verified customer leads — all in one platform." },
  { icon: Users, title: "Who are your prospects?", body: "Any registered travel business: tour operators, visa filing offices, Umrah/Hajj operators, travel insurance brokers, flight ticketing desks. If they handle travel services in Pakistan, they need GlobeTrek." },
  { icon: Zap, title: "What do vendors get?", body: "A professional digital storefront, verified customer leads, WhatsApp inquiry alerts, AI tools for creating tour descriptions and itineraries, financial reporting, and a Safepay-powered payment system — all in PKR." },
  { icon: BookOpen, title: "What are the subscription plans?", body: "Starter (PKR 3,000/mo): Basic listing + 3 lead credits. Pro (PKR 10,000/mo): Unlimited leads + AI tools + priority placement. Both plans are month-to-month, no long-term contract." },
];

function BecomeAffiliatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const registerFn = useServerFn(registerAffiliate);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", cnic: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
            <Share2 className="size-3.5" /> Sales Affiliate Program — Open to Everyone
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Turn your network<br />into <span className="text-primary">real income</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            Bring travel agencies onto GlobeTrek PK. Earn <strong className="text-foreground">PKR 600–2,000</strong> for every agency that subscribes — one-time, directly paid to your JazzCash or EasyPaisa every Friday.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-bold rounded-2xl gap-2 text-base px-8"
              onClick={() => setShowForm(true)}
            >
              <BadgeCheck className="size-5" /> Register as Affiliate — Free
            </Button>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="rounded-2xl text-base px-8 gap-2">
                How it works <ArrowRight className="size-4" />
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {["No targets. No pressure.", "Unlimited referrals", "Paid every Friday", "JazzCash / EasyPaisa"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-400" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMISSION CARDS ── */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">How much will you earn?</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">20% one-time commission on every subscription you close.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {PLANS.map((p) => (
              <div key={p.name} className={cn("relative rounded-2xl border p-6 text-center", p.bg, p.border)}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Highest earning
                  </div>
                )}
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{p.name}</div>
                <div className="text-xs text-muted-foreground mb-3">PKR {p.price.toLocaleString()}/month</div>
                <div className={cn("text-4xl font-black", p.color)}>PKR {p.commission.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">per successful signup</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Plus: earn again on <strong className="text-foreground">plan upgrades</strong>. If your Starter agency upgrades to Pro, you earn PKR 2,000 more.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-12 px-4 bg-surface/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-8">How it works — 4 simple steps</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "1", icon: BadgeCheck, title: "Register below", body: "Fill the form, get your unique referral code instantly. e.g. REF-AHMED1234", color: "bg-primary/10 text-primary" },
              { step: "2", icon: Users, title: "Visit a travel agency", body: "Go to any travel agency and pitch GlobeTrek PK. Show them the platform on your phone.", color: "bg-violet-500/10 text-violet-400" },
              { step: "3", icon: Share2, title: "Vendor uses your code", body: "When the agency signs up, they enter your referral code at checkout before paying.", color: "bg-amber-500/10 text-amber-400" },
              { step: "4", icon: DollarSign, title: "You earn commission", body: "PKR 600 or PKR 2,000 credited instantly. Paid every Friday via JazzCash/EasyPaisa.", color: "bg-emerald-500/10 text-emerald-400" },
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

      {/* ── ABOUT THE PLATFORM ── */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">Understand what you're selling</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">The more you know the platform, the easier the sale.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5 flex gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="size-4 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO EARN MORE ── */}
      <section className="py-12 px-4 bg-surface/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">Tips to earn more</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">Strategies from top-performing affiliates.</p>
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
      <section className="py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold mb-2">Your pitch script</h2>
          <p className="text-center text-xs text-muted-foreground mb-6">Use this when approaching travel agencies</p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 font-mono text-xs text-foreground leading-relaxed space-y-3">
            <p><span className="text-primary font-bold">YOU:</span> "Assalam-o-Alaikum, main aapko GlobeTrek PK ke baray mein batana chahta tha — yeh Pakistan ka pehla digital travel marketplace hai."</p>
            <p><span className="text-primary font-bold">YOU:</span> "Iss platform par aapki agency list hoti hai, aur verified customers seedha aapko contact kartay hain. Leads milti hain, payment online hoti hai, aur AI tools bhi hain tour descriptions likhnay ke liye."</p>
            <p><span className="text-primary font-bold">YOU:</span> "Starter plan sirf PKR 3,000/month hai. Pehla mahina free demo kar saktay hain. Main aapko 5 minute mein poora platform dikha sakta hun?"</p>
            <div className="border-t border-primary/20 pt-3 mt-3">
              <p className="text-muted-foreground text-[10px]">If they say yes → Show them: tour.testbench.shop → login demo → features tour</p>
              <p className="text-muted-foreground text-[10px]">If they hesitate → "No commitment. Main aapko brochure chor ta hun aur WhatsApp number de ta hun."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4 bg-surface/30">
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
      <section id="register" className="py-16 px-4">
        <div className="mx-auto max-w-md">
          {done ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="size-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">You're in! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6">Your unique referral code is ready. Share it with travel agencies when they sign up on GlobeTrek PK.</p>
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
                <h2 className="text-2xl font-bold">Register as Affiliate</h2>
                <p className="text-xs text-muted-foreground mt-1">Free. Instant approval. Start earning today.</p>
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-xl gap-2 mt-2"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                  {loading ? "Registering..." : "Get My Referral Code"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  By registering you agree to GlobeTrek's affiliate terms. CNIC is only used for payout identity verification.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GlobeTrek PK · <Link to="/" className="hover:text-foreground">Back to Home</Link> ·{" "}
        <Link to="/affiliate" className="hover:text-foreground">Affiliate Dashboard</Link>
      </footer>
    </div>
  );
}
