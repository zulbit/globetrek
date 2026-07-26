import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, Globe2, Boxes, CreditCard } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/vendors", label: "Vendors", icon: Users },
  { to: "/admin/tours", label: "Global Tours", icon: Globe2 },
  { to: "/admin/services", label: "Services marketplace", icon: Boxes },
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
