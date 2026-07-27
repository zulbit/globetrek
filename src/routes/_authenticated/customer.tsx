import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Heart,
  Plane,
  FileCheck,
  Shield,
  Ticket,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-tour-collections";
import { supabase } from "@/integrations/supabase/client";
import { RoleGuard } from "@/components/role-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPKR } from "@/lib/tours";

const CUSTOMER_NAV = [
  { to: "/customer", label: "My Travel Hub", icon: Compass },
  { to: "/tours", label: "Explore Tours", icon: Plane },
  { to: "/visa", label: "Visa Services", icon: FileCheck },
  { to: "/insurance", label: "Travel Insurance", icon: Shield },
  { to: "/tickets", label: "Flight Desks", icon: Ticket },
];

export const Route = createFileRoute("/_authenticated/customer")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();

  // Fetch traveler's custom tour requests & inquiries
  const { data: myInquiries, isLoading: loadingInquiries } = useQuery({
    queryKey: ["customer-my-inquiries", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      // 1. Fetch standard catalog inquiries
      let leads: any[] = [];
      try {
        const { data: lData } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        leads = lData ?? [];
      } catch {
        /* grace */
      }

      // 2. Fetch custom tour lead requests
      let customRequests: any[] = [];
      try {
        const { data: cr } = await supabase
          .from("custom_tour_leads")
          .select("*")
          .order("created_at", { ascending: false });
        customRequests = cr ?? [];
      } catch {
        /* grace for missing table */
      }

      return {
        leads: leads ?? [],
        customRequests,
      };
    },
  });

  return (
    <RoleGuard allow={["customer", "vendor", "admin"]}>
      <DashboardShell
        title="Traveler Hub"
        subtitle="Manage your saved packages, custom tour requests, and quotes."
        nav={CUSTOMER_NAV}
        wide={true}
      >
        <div className="space-y-8 pb-10 w-full">
          {/* Welcome Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-card to-card p-6 sm:p-8 shadow-card">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold px-3 py-1 text-xs">
                  👋 Welcome Back
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Ready for your next adventure?
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Track your custom tour proposals, compare saved packages, and connect directly with verified Pakistani travel vendors.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button asChild size="sm" className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                  <Link to="/custom-tour">
                    <Sparkles className="size-4" /> Build Custom Itinerary
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2 font-semibold rounded-xl border-border">
                  <Link to="/tours">
                    Explore Marketplace <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 space-y-2 border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Saved Packages</span>
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Heart className="size-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground font-mono">
                {wishlistItems.length}
              </div>
              <p className="text-xs text-muted-foreground">Wishlist packages in PKR</p>
            </Card>

            <Card className="p-5 space-y-2 border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Custom Requests</span>
                <div className="size-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Compass className="size-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground font-mono">
                {myInquiries?.customRequests.length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Submitted group tour requests</p>
            </Card>

            <Card className="p-5 space-y-2 border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Inquiries</span>
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <ShoppingBag className="size-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground font-mono">
                {myInquiries?.leads.length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Direct vendor inquiries sent</p>
            </Card>

            <Card className="p-5 space-y-2 border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Account Status</span>
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-2">
                <ShieldCheck className="size-4" /> Verified Traveler
              </div>
              <p className="text-xs text-muted-foreground">Zero hidden FX fees in PKR</p>
            </Card>
          </div>

          {/* Main Content Grid: Inquiries & Wishlist */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Custom Tour Requests & Vendor Proposals */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                      <Compass className="size-5 text-primary" /> My Custom Tour Requests &amp; Bids
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Quotations and proposals submitted by verified Pakistani vendors for your custom group requests.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl border-primary/30 text-primary">
                    <Link to="/custom-tour">
                      + New Request
                    </Link>
                  </Button>
                </div>

                {loadingInquiries ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Loading your custom proposals...
                  </div>
                ) : myInquiries?.customRequests && myInquiries.customRequests.length > 0 ? (
                  <div className="space-y-4">
                    {myInquiries.customRequests.map((req: any) => (
                      <div key={req.id} className="rounded-2xl border border-border bg-surface/50 p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground text-sm">{req.destination_country} Tour</h3>
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                                {req.status || "Bidding Open"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {req.duration_days} Days · Budget: {formatPKR(req.budget_pkr || 250000)} · Departure: {req.departure_city || "Karachi"}
                            </p>
                          </div>
                          {req.share_token && (
                            <Button asChild size="sm" className="gap-1.5 font-bold text-xs bg-primary text-primary-foreground rounded-xl">
                              <Link to={`/customer/quotes?token=${req.share_token}`}>
                                View Proposals <ExternalLink className="size-3.5" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/80 p-6">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Sparkles className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground">No Custom Tour Requests Yet</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Planning a group trip? Submit your budget and dates, and top Pakistani agencies will bid with customized proposals.
                      </p>
                    </div>
                    <Button asChild size="sm" className="gap-1.5 font-bold text-xs bg-primary text-primary-foreground rounded-xl mt-2">
                      <Link to="/custom-tour">
                        Create Custom Trip Request
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Saved Wishlist Packages */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Heart className="size-4 text-rose-500 fill-rose-500" /> Saved Packages ({wishlistItems.length})
                  </h2>
                  <Link to="/tours" className="text-xs text-primary hover:underline font-semibold">
                    Browse All
                  </Link>
                </div>

                {wishlistItems.length > 0 ? (
                  <div className="space-y-3">
                    {wishlistItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-surface/40 hover:bg-surface transition">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                          <p className="text-[11px] text-muted-foreground">
                            {item.destination} · <span className="text-primary font-bold">{formatPKR(item.pricePkr)}</span>
                          </p>
                        </div>
                        <Button asChild size="xs" variant="outline" className="text-[11px] font-semibold h-7 rounded-lg shrink-0">
                          <Link to={`/tours/${item.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2 text-muted-foreground">
                    <Heart className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs">No saved tour packages in your wishlist.</p>
                    <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-primary">
                      <Link to="/tours">Browse Tours Catalog</Link>
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
