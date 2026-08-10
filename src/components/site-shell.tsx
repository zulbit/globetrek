import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { Mountain, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 md:pb-12">{children}</main>

      {/* Unified Responsive Footer (Mobile & Desktop) */}
      <footer className="border-t border-border bg-slate-950/80 text-foreground pt-10 pb-28 md:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand Col */}
            <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-3">
              <Link to="/" className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Mountain className="size-4" />
                </span>
                <span className="text-base font-bold tracking-tight text-white">
                  GlobeTrek <span className="text-primary">PK</span>
                </span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pakistan's first AI-driven international travel discovery platform. Connecting travelers directly with DTS-licensed tour operators, visa desks &amp; insurance providers with 0% booking commission.
              </p>
              <div className="pt-1">
                <a
                  href="https://wa.me/923490386131?text=Assalam-o-Alaikum%20GlobeTrek%20PK%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  <MessageSquare className="size-3.5" />
                  <span>WhatsApp: +92 349 0386131</span>
                </a>
              </div>
            </div>

            {/* Services Col */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Marketplace
              </span>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/tours" className="hover:text-primary transition-colors">
                    International Tour Packages
                  </Link>
                </li>
                <li>
                  <Link to="/visa" className="hover:text-primary transition-colors">
                    Visa Filing Services
                  </Link>
                </li>
                <li>
                  <Link to="/insurance" className="hover:text-primary transition-colors">
                    Travel Insurance Plans
                  </Link>
                </li>
                <li>
                  <Link to="/tickets" className="hover:text-primary transition-colors">
                    Flight Desks &amp; Umrah
                  </Link>
                </li>
                <li>
                  <Link to="/custom-tour" className="hover:text-primary text-emerald-400 font-semibold transition-colors flex items-center gap-1">
                    <Sparkles className="size-3" /> Custom Tour Planner
                  </Link>
                </li>
              </ul>
            </div>

            {/* Partners & Ecosystem */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Agencies &amp; Partners
              </span>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/pricing" className="hover:text-primary transition-colors">
                    Vendor Subscription Tiers
                  </Link>
                </li>
                <li>
                  <Link to="/vendor-guide" className="hover:text-primary transition-colors">
                    Agency Operating Guide
                  </Link>
                </li>
                <li>
                  <Link to="/become-affiliate" className="hover:text-primary transition-colors">
                    Become an Affiliate (Earn PKR)
                  </Link>
                </li>
                <li>
                  <Link to="/auth" search={{ mode: "signup" } as never} className="hover:text-primary font-bold text-primary transition-colors">
                    Register Travel Agency
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Compliance */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Trust &amp; Policies
              </span>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Terms &amp; Operating Policies
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Agency KYC &amp; Verification
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    SafePay Payment Security
                  </Link>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400 font-medium pt-1">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>DTS-Verified Agencies</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left">
            <p>© {new Date().getFullYear()} GlobeTrek PK. All rights reserved.</p>
            <p className="flex items-center justify-center gap-2">
              <span>All prices listed in PKR (₨)</span>
              <span>·</span>
              <span>256-Bit SSL Encrypted</span>
            </p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
