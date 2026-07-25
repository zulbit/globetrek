import { Link } from "@tanstack/react-router";
import { Home, Compass, Heart, Shield, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-tour-collections";

export function BottomNav() {
  const { user, role } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const accountTo = user
    ? role === "admin"
      ? "/admin"
      : role === "vendor"
        ? "/vendor"
        : "/dashboard"
    : "/auth";

  const items: { to: string; label: string; Icon: typeof Home; exact?: boolean; badge?: number }[] = [
    { to: "/", label: "Home", Icon: Home, exact: true },
    { to: "/tours", label: "Tours", Icon: Compass },
    { to: "/wishlist", label: "Saved", Icon: Heart, badge: wishlistItems.length },
    { to: "/insurance", label: "Insure", Icon: Shield },
    { to: accountTo, label: user ? "Account" : "Sign in", Icon: User },
  ];



  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-background/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, Icon, exact, badge }) => (
          <li key={label}>
            <Link
              to={to}
              className="relative flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: !!exact }}
            >
              <span className="relative">
                <Icon className="size-5" />
                {badge && badge > 0 ? (
                  <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
