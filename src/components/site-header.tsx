import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Mountain,
  LogOut,
  LayoutDashboard,
  Loader2,
  Heart,
  Menu,
  Compass,
  FileText,
  Shield,
  Plane,
  Sparkles,
  DollarSign,
  BookOpen,
  Coins,
  ChevronRight,
  UserPlus,
  LogIn,
  X,
} from "lucide-react";
import { useWishlist } from "@/hooks/use-tour-collections";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/tours", label: "Tours" },
  { to: "/visa", label: "Visa" },
  { to: "/insurance", label: "Insurance" },
  { to: "/tickets", label: "Tickets" },
  { to: "/pricing", label: "Pricing" },
  { to: "/vendor-guide", label: "Guide" },
  { to: "/become-affiliate", label: "Earn Money" },
] as const;

export function SiteHeader() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { items: wishlistItems } = useWishlist();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    setIsMobileDrawerOpen(false);
    navigate({ to: "/", replace: true });
  }

  const dashboardTo = (
    role === "admin"
      ? "/admin"
      : role === "vendor"
        ? "/vendor"
        : "/customer"
  ) as never;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile Hamburger Drawer Trigger */}
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-9 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[85vw] max-w-xs sm:max-w-sm p-0 flex flex-col bg-background border-r border-border"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/40">
              <Link
                to="/"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Mountain className="size-4" />
                </span>
                <span className="text-base font-bold tracking-tight">
                  GlobeTrek <span className="text-primary">PK</span>
                </span>
              </Link>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>

            {/* Drawer Body Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Marketplace Services */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-2">
                  Marketplace Services
                </span>
                <Link
                  to="/tours"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Compass className="size-4 text-emerald-400" />
                    <span>International Tours</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/visa"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="size-4 text-sky-400" />
                    <span>Visa Filing Desks</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/insurance"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="size-4 text-amber-400" />
                    <span>Travel Insurance</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/tickets"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Plane className="size-4 text-indigo-400" />
                    <span>Flights &amp; Umrah</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/custom-tour"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="size-4 text-emerald-400" />
                    <span className="font-bold">Build Custom Tour</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    AI Lead
                  </span>
                </Link>
              </div>

              {/* Partners & Ecosystem */}
              <div className="space-y-1 border-t border-border/60 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-2">
                  Partner Ecosystem
                </span>
                <Link
                  to="/pricing"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <DollarSign className="size-4 text-primary" />
                    <span>Vendor Pricing</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/vendor-guide"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className="size-4 text-teal-400" />
                    <span>Agency Operating Guide</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/become-affiliate"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Coins className="size-4 text-amber-400" />
                    <span>Earn Money (Affiliate)</span>
                  </span>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    Earn PKR
                  </span>
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="size-4 text-rose-400" />
                    <span>Saved Wishlist</span>
                  </span>
                  {wishlistItems.length > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Drawer Footer Account & Controls */}
            <div className="p-4 border-t border-border bg-surface/30 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="truncate">
                      <span className="block text-xs font-bold text-foreground truncate">
                        {user.email}
                      </span>
                      {role && (
                        <span className="text-[10px] font-semibold text-primary capitalize">
                          ● {role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={dashboardTo}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <LayoutDashboard className="size-3.5" /> Dashboard
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      <LogOut className="mr-1 size-3.5" /> Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/auth"
                    search={{ mode: "signup", role: "vendor" } as never}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-2 text-xs font-bold text-primary hover:bg-primary/20 text-center"
                  >
                    <UserPlus className="size-3.5" /> List Tours
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-primary px-2 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 text-center"
                  >
                    <LogIn className="size-3.5" /> Sign In
                  </Link>
                </div>
              )}

              {/* Utility Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium">
                  <span className="size-1.5 rounded-full bg-primary" /> PKR (₨)
                </span>
                <div className="flex items-center gap-1">
                  <span>Theme:</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Brand Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-2 shrink-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Mountain className="size-5" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight">
            GlobeTrek <span className="text-primary">PK</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "text-foreground bg-surface" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Controls & Auth */}
        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
            title="All prices in Pakistani Rupee"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            PKR (₨)
          </span>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative hidden sm:inline-flex items-center justify-center rounded-md border border-border bg-surface p-2 text-muted-foreground hover:text-foreground"
          >
            <Heart
              className={`size-4 ${wishlistItems.length > 0 ? "fill-rose-400 text-rose-300" : ""}`}
            />
            {wishlistItems.length > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Link
                to={dashboardTo}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary/25"
              >
                <LayoutDashboard className="size-3.5" /> Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="grid size-9 place-items-center rounded-full bg-surface text-xs font-semibold ring-1 ring-border hover:ring-primary/40">
                  {(user.email?.[0] || "U").toUpperCase()}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
                    {user.email}
                    {role && <span className="ml-1 text-primary">· {role}</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardTo}>
                      <LayoutDashboard className="mr-2 size-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signup", role: "vendor" } as never}
                className="hidden sm:inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                List your tours
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Sign in
              </Link>
            </>
          )}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
