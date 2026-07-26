import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Mountain, LogOut, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  title,
  subtitle,
  nav,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  children: ReactNode;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={cn("mx-auto flex", wide ? "max-w-none w-full px-4 md:px-8" : "max-w-7xl")}>
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/40 px-4 py-6 md:flex">
          <Link to="/" className="mb-6 flex items-center gap-2 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Mountain className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              GlobeTrek <span className="text-primary">PK</span>
            </span>
          </Link>

          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = path === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {title}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {subtitle}
              </h1>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground md:hidden"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </header>

          {/* Mobile nav */}
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {nav.map((n) => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                    active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${accent ? "text-highlight" : ""}`}>
        {value}
      </div>
    </div>
  );
}
