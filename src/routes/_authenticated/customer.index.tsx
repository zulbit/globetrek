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
  ShieldCheck,
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

import { getCustomerCustomRequestsWithQuotes } from "@/lib/custom-tour-leads.functions";
import { getCustomerCustomVisaRequestsWithQuotes } from "@/lib/custom-visa-leads.functions";

const CUSTOMER_NAV = [
  { to: "/customer", label: "My Travel Hub", icon: Compass },
  { to: "/tours", label: "Explore Tours", icon: Plane },
  { to: "/custom-visa", label: "Visa Consultation", icon: FileCheck },
  { to: "/insurance", label: "Travel Insurance", icon: Shield },
  { to: "/tickets", label: "Flight Desks", icon: Ticket },
];

export const Route = createFileRoute("/_authenticated/customer/")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();

  // Fetch standard catalog inquiries
  const { data: catalogLeads = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ["customer-catalog-leads", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        return data ?? [];
      } catch {
        return [];
      }
    },
  });

  // Fetch custom tour requests with live vendor proposals
  const { data: customRequests = [], isPending: loadingCustom } = useQuery({
    queryKey: ["customer-custom-requests-quotes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => getCustomerCustomRequestsWithQuotes(),
    placeholderData: (prev) => prev,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  // Fetch custom visa requests with live consultant proposals
  const { data: customVisaRequests = [], isPending: loadingCustomVisa } = useQuery({
    queryKey: ["customer-custom-visa-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => getCustomerCustomVisaRequestsWithQuotes(),
    placeholderData: (prev) => prev,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const loadingInquiries = loadingCatalog || (loadingCustom && !customRequests.length) || (loadingCustomVisa && !customVisaRequests.length);

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
                {customRequests.length}
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
                {catalogLeads.length}
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
            {/* Left: Custom Tour & Visa Requests & Vendor Proposals */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-6">
                {/* 0. Custom Visa Consultation Requests & Live Proposals (HIGH PRIORITY) */}
                <Card className="p-6 space-y-5 border-border bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                        <FileCheck className="size-5 text-rose-400" /> My Custom Visa Requests &amp; Expert Bids
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        File preparation quotes, refusal case solutions, and embassy appointment assistance from top consultants.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl border-rose-500/30 text-rose-400 shrink-0">
                      <Link to="/custom-visa">
                        + New Visa Request
                      </Link>
                    </Button>
                  </div>

                  {loadingCustomVisa ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Loading your visa consultation proposals...
                    </div>
                  ) : customVisaRequests.length > 0 ? (
                    <div className="space-y-5">
                      {customVisaRequests.map((vReq: any) => (
                        <div
                          key={vReq.id}
                          className={`rounded-2xl border p-5 space-y-4 transition bg-surface/50 ${
                            vReq.quote_count > 0
                              ? "border-rose-500/40 shadow-sm shadow-rose-500/5 bg-rose-500/[0.02]"
                              : "border-border"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                                  🛂 {vReq.destination_country} · {vReq.visa_category}
                                </span>
                                {vReq.has_prior_rejection ? (
                                  <Badge variant="destructive" className="text-[10px] font-bold">
                                    🚨 Refusal Case
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                                    🟢 Fresh Applicant
                                  </Badge>
                                )}
                                {vReq.quote_count > 0 ? (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase font-bold">
                                    🎉 {vReq.quote_count} {vReq.quote_count === 1 ? "Proposal" : "Proposals"} Received
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    ⏳ Bidding Open (Up to 5 Consultants)
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                🏢 <strong>{vReq.submission_office}</strong> · 📍 Resident: {vReq.customer_city} · 👥 {vReq.applicant_count || 1} Applicant(s) · 💼 Profile: {vReq.applicant_profile}
                              </p>
                              {vReq.has_prior_rejection && vReq.rejection_details && (
                                <p className="text-[11px] text-rose-300 italic bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
                                  Refusal details: "{vReq.rejection_details}"
                                </p>
                              )}
                            </div>

                            <Button asChild size="sm" className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground shrink-0 shadow-sm">
                              <Link to="/customer/visa-quotes" search={{ token: vReq.id } as any}>
                                View Proposals ({vReq.quote_count}) <ArrowRight className="size-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-muted-foreground">
                        You have not submitted any custom visa inquiries yet. Need help with a refusal, appointment slot, or document checklist?
                      </p>
                      <Button asChild size="sm" className="gap-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs">
                        <Link to="/custom-visa">
                          <FileCheck className="size-4" /> Request Custom Visa Consultation
                        </Link>
                      </Button>
                    </div>
                  )}
                </Card>

                {/* 1. Custom Group Tour Requests & Live Agency Quotes (TOP POSITION) */}
                <Card className="p-6 space-y-5 border-border bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                        <Compass className="size-5 text-primary" /> My Custom Tour Requests &amp; Bids
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Live quotations, customized itineraries, and bids submitted by verified Pakistani travel agencies.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl border-primary/30 text-primary shrink-0">
                      <Link to="/custom-tour">
                        + New Request
                      </Link>
                    </Button>
                  </div>

                  {loadingCustom ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Loading your custom trip proposals...
                    </div>
                  ) : customRequests.length > 0 ? (
                    <div className="space-y-6">
                      {customRequests.map((req) => (
                        <div
                          key={req.id}
                          className={`rounded-2xl border p-5 space-y-4 transition bg-surface/50 ${
                            req.quotes_count > 0
                              ? "border-emerald-500/40 shadow-sm shadow-emerald-500/5 bg-emerald-500/[0.02]"
                              : "border-border"
                          }`}
                        >
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                                  ✈️ {req.departure_city || "Pakistan"} → {req.destination}
                                </span>
                                <h3 className="font-extrabold text-foreground text-base capitalize">
                                  {req.destination ? `${req.destination} Trip` : "Custom Tour Request"}
                                </h3>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                                  {req.status || "verified"}
                                </Badge>
                                {req.quotes_count > 0 ? (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase font-bold">
                                    🎉 {req.quotes_count} {req.quotes_count === 1 ? "Quotation" : "Quotations"} Ready
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    ⏳ Bids Open in Marketplace
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                📅 <strong>{req.travel_month || "Upcoming"}</strong> · ⏳ {req.duration_days ?? 7} Days · 👥 {req.group_size ?? 1} Travelers ({req.group_type || "Family"}) · 🏨 Hotel: <strong className="text-foreground capitalize">{(req.hotel_tier || "3star").replace("star", " ★")}</strong>
                              </p>
                              {req.special_requests && (
                                <p className="text-[11px] text-muted-foreground/80 italic mt-1 bg-surface/80 px-2.5 py-1 rounded-lg border border-border/50">
                                  "{req.special_requests}"
                                </p>
                              )}
                            </div>

                            {/* Main CTA to Open Proposal Desk */}
                            <Button asChild size="sm" className={`gap-1.5 font-bold text-xs rounded-xl shrink-0 ${
                              req.quotes_count > 0
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md hover:opacity-95"
                                : "bg-primary text-primary-foreground"
                            }`}>
                              <Link to={`/customer/quotes?token=${req.id}`}>
                                {req.quotes_count > 0 ? (
                                  <>
                                    <Sparkles className="size-3.5" /> View &amp; Compare ({req.quotes_count}) <ArrowRight className="size-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <Compass className="size-3.5" /> Open Quotation Desk <ExternalLink className="size-3.5" />
                                  </>
                                )}
                              </Link>
                            </Button>
                          </div>

                          {/* CLICKABLE QUOTATION CARDS */}
                          {req.quotes && req.quotes.length > 0 && (
                            <div className="space-y-2.5 pt-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-amber-400" /> Submitted Agency Proposals (Click to Review &amp; Book):
                              </h4>

                              <div className="grid gap-3">
                                {req.quotes.map((q) => (
                                  <Link
                                    key={q.id}
                                    to={`/customer/quotes?token=${req.id}`}
                                    className="group/quote relative block rounded-2xl border border-emerald-500/30 bg-card p-4 hover:border-emerald-500 hover:bg-emerald-500/[0.04] transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5 mb-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                          🏢
                                        </div>
                                        <div>
                                          <h5 className="font-bold text-sm text-foreground group-hover/quote:text-primary transition flex items-center gap-1.5">
                                            {q.vendor_company || q.vendor_name}
                                            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                              Verified Agency
                                            </span>
                                          </h5>
                                          <p className="text-[11px] text-muted-foreground">
                                            Submitted {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Package Price</span>
                                        <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                                          Rs {q.quote_amount.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Quote Details Snippet */}
                                    <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                                      {q.hotel_details && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <Building className="size-3.5 text-amber-400 shrink-0" />
                                          <span className="truncate">{q.hotel_details}</span>
                                        </div>
                                      )}
                                      {q.flight_details && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <Plane className="size-3.5 text-sky-400 shrink-0" />
                                          <span className="truncate">{q.flight_details}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Inclusions tags */}
                                    {q.inclusions && q.inclusions.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        {q.inclusions.slice(0, 4).map((inc, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
                                          >
                                            <CheckCircle2 className="size-2.5" /> {inc}
                                          </span>
                                        ))}
                                        {q.inclusions.length > 4 && (
                                          <span className="text-[10px] text-muted-foreground self-center">
                                            +{q.inclusions.length - 4} more
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Card Footer Bar */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-xs font-semibold text-primary group-hover/quote:text-emerald-400 transition">
                                      <span className="text-[11px] text-muted-foreground">
                                        {q.perks && q.perks.length > 0 ? `🎁 ${q.perks[0]}` : "⚡ Instant Booking Available"}
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        Review &amp; Accept Proposal <ArrowRight className="size-3.5 group-hover/quote:translate-x-1 transition-transform" />
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
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

                {/* 2. Standard Catalog Tour Inquiries & Bookings (SWAPPED TO BOTTOM) */}
                <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                        <ShoppingBag className="size-5 text-amber-400" /> Regular Catalog Package Inquiries
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Fixed marketplace packages (e.g. Baku, Dubai, Hunza) you inquired about or booked.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl border-amber-500/30 text-amber-400">
                      <Link to="/tours">
                        Browse Catalog
                      </Link>
                    </Button>
                  </div>

                  {loadingCatalog ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Loading catalog package inquiries...
                    </div>
                  ) : catalogLeads.length > 0 ? (
                    <div className="space-y-3">
                      {catalogLeads.map((inq: any) => (
                        <div key={inq.id} className="rounded-2xl border border-border/80 bg-surface/50 p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-foreground text-sm">
                                  {inq.tours?.title || "Tour Package Inquiry"}
                                </h3>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold">
                                  Inquiry Sent
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Submitted on {new Date(inq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} {inq.message ? `· "${inq.message}"` : ""}
                              </p>
                            </div>
                            {inq.tour_id && (
                              <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold text-xs rounded-xl border-border">
                                <Link to={`/tours/${inq.tour_id}` as never}>
                                  View Tour <ExternalLink className="size-3.5" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2 rounded-2xl border border-dashed border-border/80 p-6">
                      <ShoppingBag className="size-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">You haven't submitted any direct catalog package inquiries yet.</p>
                      <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-primary">
                        <Link to="/tours">Explore Marketplace Packages</Link>
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
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
                            {item.destination} · <span className="text-primary font-bold">{formatPKR(item.pricePKR)}</span>
                          </p>
                        </div>
                        <Button asChild size="xs" variant="outline" className="text-[11px] font-semibold h-7 rounded-lg shrink-0">
                          <Link to={`/tours/${item.id}` as never}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2 rounded-2xl border border-dashed border-border/80 p-6">
                    <Heart className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No saved tour packages in your wishlist.</p>
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
