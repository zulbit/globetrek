import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, Inbox, CreditCard, Settings2,
  FileCheck, Shield, Ticket, BookOpen, Receipt, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/vendor")({
  component: VendorLayout,
});

function VendorLayout() {
  const { user } = useAuth();
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

  const services: string[] = (profile?.vendor_services as string[] | null) ?? ["tours"];
  const has = (s: string) => services.includes(s);

  const nav: NavItem[] = [
    { to: "/vendor", label: "Overview", icon: LayoutDashboard },
    { to: "/vendor/leads", label: "Leads inbox", icon: Inbox },
    ...(has("tours")     ? [{ to: "/vendor/tours",     label: "Tour packages", icon: Package    }] : []),
    ...(has("visa")      ? [{ to: "/vendor/visa",      label: "Visa services", icon: FileCheck  }] : []),
    ...(has("insurance") ? [{ to: "/vendor/insurance", label: "Insurance",     icon: Shield     }] : []),
    ...(has("tickets")   ? [{ to: "/vendor/tickets",   label: "Ticketing",     icon: Ticket     }] : []),
    { to: "/vendor/services", label: "Services offered", icon: Settings2 },
    { to: "/vendor-guide", label: "Vendor Operating Guide", icon: BookOpen },
    { to: "/vendor/billing",  label: "Plan & billing",   icon: CreditCard },
    { to: "/vendor/invoices", label: "Invoices & Receipts", icon: Receipt },
  ];

  const isPending = profile?.vendor_status === "pending";

  return (
    <RoleGuard allow={["vendor", "admin"]}>
      <DashboardShell title="Vendor Portal" subtitle="Grow your travel business" nav={nav} wide>
        {isPending && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">Account Pending Admin Verification</h4>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    ⏳ Under Review
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Your agency registration details ({profile?.company_name ? `"${profile.company_name}"` : "Agency"} · Mobile: {profile?.phone || "WhatsApp registered"}) are currently under review by GlobeTrek PK Admins. You have full access to explore the portal and configure your services. Active listing visibility and lead details will unlock as soon as Admin approves your account (usually within 24 hours).
                </p>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
