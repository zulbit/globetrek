import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pb-24 md:pb-16">{children}</main>
      <footer className="hidden md:block border-t border-border bg-surface/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GlobeTrek PK · International tour marketplace.</p>
          <p>Prices in PKR (₨). Rates indicative — Phase 1 preview.</p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
