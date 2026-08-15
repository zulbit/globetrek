import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, Inbox, CreditCard, Settings2,
  FileCheck, Shield, Ticket, BookOpen, Receipt, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

import { useServerFn } from "@tanstack/react-start";
import { getVendorKYCDetails } from "@/lib/kyc.functions";

export const Route = createFileRoute("/_authenticated/vendor")({
  component: VendorLayout,
});

function VendorLayout() {
  const { user } = useAuth();
  const getKycFn = useServerFn(getVendorKYCDetails);

  const { data: profile } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-services-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("vendor_services, vendor_status, phone, company_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: kycData } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-kyc-existing", user?.id],
    queryFn: () => getKycFn({ data: { userId: user!.id } }),
  });

  const services: string[] = (profile?.vendor_services as string[] | null) ?? ["tours"];
  const has = (s: string) => services.includes(s);
  
  const isApproved = profile?.vendor_status === "approved";
  const isSubmitted = !isApproved && !!kycData?.isSubmitted;
  const isNotSubmitted = !isApproved && !isSubmitted;

  const kycBadgeText = isApproved ? undefined : isSubmitted ? "Under Review" : "Action Required";

  const nav: NavItem[] = [
    { to: "/vendor", label: "Overview", icon: LayoutDashboard },
    { to: "/vendor/kyc", label: "Agency Verification (KYC)", icon: ShieldCheck, badge: kycBadgeText },
    { to: "/vendor/leads", label: "Direct Inquiries", icon: Inbox },
    { to: "/vendor/custom-leads", label: "Custom Tour Leads", icon: Sparkles, badge: "HOT" },
    { to: "/vendor/custom-visa-leads", label: "Custom Visa Leads", icon: FileCheck, badge: "HOT" },
    ...(has("tours")     ? [{ to: "/vendor/tours",     label: "Tour packages", icon: Package    }] : []),
    ...(has("visa")      ? [{ to: "/vendor/visa",      label: "Visa services", icon: FileCheck  }] : []),
    ...(has("insurance") ? [{ to: "/vendor/insurance", label: "Insurance",     icon: Shield     }] : []),
    ...(has("tickets")   ? [{ to: "/vendor/tickets",   label: "Ticketing",     icon: Ticket     }] : []),
    { to: "/vendor/services", label: "Services offered", icon: Settings2 },
    { to: "/vendor-guide", label: "Vendor Operating Guide", icon: BookOpen },
    { to: "/vendor/billing",  label: "Plan & billing",   icon: CreditCard },
    { to: "/vendor/invoices", label: "Invoices & Receipts", icon: Receipt },
  ];

  return (
    <RoleGuard allow={["vendor", "admin"]}>
      <DashboardShell title="Vendor Portal" subtitle="Grow your travel business" nav={nav} wide>
        {isNotSubmitted && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-card to-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">Setup Mode — Agency Verification Required</h4>
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider animate-pulse">
                    ⚠️ KYC Not Submitted
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Your account is in <span className="text-foreground font-semibold">Setup Mode</span>. You can prepare package drafts, but publishing live listings to travelers and unlocking buyer leads requires DTS license and NTN verification.
                </p>
              </div>
            </div>

            <Button asChild size="sm" className="bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs rounded-xl px-4 shrink-0 gap-1.5 shadow-md">
              <Link to="/vendor/kyc">
                Submit KYC Credentials <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {isSubmitted && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">Verification Application Under Review</h4>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    ⏳ 24h Review SLA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Your agency verification credentials ({profile?.company_name ? `"${profile.company_name}"` : "Agency"} · Contact: {profile?.phone || "WhatsApp"}) have been received and are being reviewed by GlobeTrek PK Admins. Live listings and inquiries will activate upon approval.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold text-xs rounded-xl px-4 shrink-0 gap-1.5 shadow-xs">
              <Link to="/vendor/kyc">
                View Submitted KYC <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
