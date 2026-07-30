import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mountain, LogOut, ShieldCheck, User, KeyRound, Loader2, Lock, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

export interface NavSubItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavItem {
  to?: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  subItems?: NavSubItem[];
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
  const { user } = useAuth();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: userProfile } = useQuery({
    enabled: !!user?.id,
    queryKey: ["dashboard-shell-user-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name, email, subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const displayName = userProfile?.company_name || userProfile?.full_name || user?.email || "Vendor Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(`Could not change password: ${err.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={cn("mx-auto flex", wide ? "max-w-none w-full px-4 md:px-8" : "max-w-7xl")}>
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/40 px-4 py-6 md:flex overflow-y-auto">
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
            {nav.map((n, idx) => {
              if (n.subItems && n.subItems.length > 0) {
                return <CollapsibleNavGroup key={idx} item={n} currentPath={path} />;
              }

              const active = path === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to || idx}
                  to={n.to!}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 truncate">{n.label}</span>
                  {n.badge && (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
            <ThemeToggle />
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
            >
              <KeyRound className="size-4 text-amber-400" /> Change Password
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {title}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {subtitle}
              </h1>
            </div>

            {/* Mobile Menu Button & User Badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground md:hidden shadow-xs hover:bg-surface"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4 text-primary" />
                <span>Menu</span>
              </button>

              <button
                onClick={() => setPasswordModalOpen(true)}
                title="Account Settings & Change Password"
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-xs transition hover:border-primary/50 hover:bg-surface text-left group"
              >
                <div className="relative grid size-8 sm:size-9 place-items-center rounded-xl bg-primary/20 font-extrabold text-primary text-xs ring-1 ring-primary/40 group-hover:scale-105 transition-transform">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-foreground block leading-tight max-w-[160px] truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1 mt-0.5 font-medium">
                    <ShieldCheck className="size-3 text-emerald-400" />
                    {userProfile?.subscription_tier || "Vendor"} Partner
                  </span>
                </div>
                <KeyRound className="size-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors ml-1 hidden sm:block" />
              </button>

              <button
                onClick={signOut}
                aria-label="Sign out"
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground md:hidden"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </header>

          {/* Quick horizontal scroll pills on mobile */}
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden pb-1 -mx-2 px-2 scrollbar-none">
            {nav.flatMap((n) => (n.subItems ? n.subItems : [n])).map((n, idx) => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to || idx}
                  to={n.to!}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
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

      {/* Slide-over Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-col border-r border-border bg-card p-5 shadow-2xl z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Mountain className="size-4" />
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  GlobeTrek <span className="text-primary">PK</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="my-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title} Navigation
            </div>

            <nav className="flex flex-col gap-1.5 flex-1">
              {nav.map((n, idx) => {
                if (n.subItems && n.subItems.length > 0) {
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {n.label}
                      </div>
                      <div className="ml-2 border-l border-border/60 pl-2 space-y-1">
                        {n.subItems.map((sub) => {
                          const active = path === sub.to;
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              onClick={() => setMobileDrawerOpen(false)}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                active
                                  ? "bg-primary/15 text-primary font-bold"
                                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
                              }`}
                            >
                              <SubIcon className="size-4 shrink-0" />
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const active = path === n.to;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to || idx}
                    to={n.to!}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                      active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{n.label}</span>
                    {n.badge && (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                        {n.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-border pt-4 flex flex-col gap-2">
              <ThemeToggle />
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <KeyRound className="size-4 text-amber-400" /> Change Password
              </button>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="size-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <KeyRound className="size-4" /> Account Security
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">Change Password</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update your account password for <span className="font-semibold text-foreground">{displayName}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-muted-foreground">New Password*</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-muted-foreground">Confirm New Password*</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" type="button" size="sm" onClick={() => setPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isChangingPassword || !newPassword}
                className="bg-primary text-primary-foreground font-bold gap-1.5 rounded-xl"
              >
                {isChangingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

function CollapsibleNavGroup({ item, currentPath }: { item: NavItem; currentPath: string }) {
  const isChildActive = (item.subItems || []).some((sub) => currentPath === sub.to);
  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = item.icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer select-none ${
          isChildActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-surface hover:text-foreground"
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge && (
          <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
            {item.badge}
          </span>
        )}
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="ml-4 pl-2.5 border-l border-border/60 space-y-1 my-1">
          {item.subItems?.map((sub) => {
            const active = currentPath === sub.to;
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.to}
                to={sub.to}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <SubIcon className="size-3.5 shrink-0" />
                <span className="truncate">{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
