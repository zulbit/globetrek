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
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
      aria-label="Mobile Navigation Bar"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, Icon, exact, badge }) => (
          <li key={label}>
            <Link
              to={to}
              className="group relative flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95"
              activeProps={{ className: "!text-primary font-bold" }}
              activeOptions={{ exact: !!exact }}
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex items-center justify-center">
                    <Icon
                      className={`size-5 transition-transform duration-200 ${
                        isActive
                          ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "group-hover:scale-105"
                      }`}
                    />
                    {badge && badge > 0 ? (
                      <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate max-w-[56px] leading-tight">{label}</span>
                  {isActive && (
                    <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary shadow-glow" />
                  )}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
