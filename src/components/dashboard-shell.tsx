import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mountain, LogOut, ShieldCheck, User, KeyRound, Loader2, Lock, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

            {/* Clickable Profile User Badge in Top Right Corner */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPasswordModalOpen(true)}
                title="Account Settings & Change Password"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2 shadow-xs transition hover:border-primary/50 hover:bg-surface text-left group"
              >
                <div className="relative grid size-9 place-items-center rounded-xl bg-primary/20 font-extrabold text-primary text-xs ring-1 ring-primary/40 group-hover:scale-105 transition-transform">
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground hover:text-foreground md:hidden"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </div>
          </header>

          {/* Mobile nav */}
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden pb-1">
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
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 pr-9 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-muted-foreground">Confirm New Password*</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 pr-9 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
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
