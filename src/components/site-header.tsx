import { Link, useNavigate } from "@tanstack/react-router";
import { Mountain, LogOut, LayoutDashboard, Loader2, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-tour-collections";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
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

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  }

  const dashboardTo = (role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/customer") as never;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2 shrink-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Mountain className="size-5" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight">
            GlobeTrek <span className="text-primary">PK</span>
          </span>
        </Link>

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
            <Heart className={`size-4 ${wishlistItems.length > 0 ? "fill-rose-400 text-rose-300" : ""}`} />
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
                search={{ mode: "signup" } as never}
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
