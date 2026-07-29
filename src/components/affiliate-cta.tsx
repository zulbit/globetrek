import { Link } from "@tanstack/react-router";
import { DollarSign, Share2, ArrowRight, CheckCircle2, BadgeCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AffiliateCTASection() {
  return (
    <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-br from-primary/10 via-card to-card border-y border-primary/20">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            <Share2 className="size-3.5" /> Earn from GlobeTrek PK
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Become a GlobeTrek Sales Partner & Earn <span className="text-primary">20% Commission</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Convince travel agencies in your city to join Pakistan's #1 digital travel marketplace. Earn <strong className="text-foreground">PKR 600 (Starter)</strong> or <strong className="text-foreground">PKR 2,000 (Pro)</strong> per agency. Weekly Friday payouts via JazzCash / EasyPaisa.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> Free registration</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> No monthly targets</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> Instant referral code</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0">
          <Link to="/become-affiliate">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-2xl gap-2 shadow-lg hover:shadow-primary/25">
              <BadgeCheck className="size-5" /> Start Earning Today <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/affiliate" className="text-xs text-muted-foreground hover:text-foreground underline">
            Already a partner? Access Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
