import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, Inbox, CreditCard, Settings2,
  FileCheck, Shield, Ticket, BookOpen,
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
        .select("vendor_services")
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
  ];

  return (
    <RoleGuard allow={["vendor", "admin"]}>
      <DashboardShell title="Vendor Portal" subtitle="Grow your travel business" nav={nav}>
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
