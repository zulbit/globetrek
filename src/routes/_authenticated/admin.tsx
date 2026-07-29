import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, Globe2, Boxes, CreditCard, Sparkles, Compass, BookOpen, Wallet, LayoutTemplate, FileCheck, Layers } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  {
    label: "CMS Engine",
    icon: Layers,
    subItems: [
      { to: "/admin/landing-cms", label: "Landing Page CMS", icon: LayoutTemplate },
      { to: "/admin/kyc-cms", label: "KYC Template CMS", icon: FileCheck },
      { to: "/admin/vendor-guide", label: "Vendor Guide CMS", icon: BookOpen },
    ],
  },
  { to: "/admin/financials", label: "Financial Collections", icon: Wallet },
  { to: "/admin/custom-leads", label: "Custom Tour Leads", icon: Compass },
  { to: "/admin/vendors", label: "Vendors & Subscriptions", icon: Users },
  { to: "/admin/subscriptions", label: "Subscription Plans", icon: Sparkles },
  { to: "/admin/tours", label: "Tours Catalog", icon: Globe2 },
  { to: "/admin/services", label: "Services Catalog", icon: Boxes },
  { to: "/admin/payments", label: "Payment gateways", icon: CreditCard },
];


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <RoleGuard allow={["admin"]}>
      <DashboardShell title="Platform Admin" subtitle="System overview" nav={NAV} wide={true}>
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
