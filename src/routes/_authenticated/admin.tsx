import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, UserCheck, Globe2, Boxes, CreditCard, Sparkles, Compass, BookOpen, Wallet, LayoutTemplate, FileCheck, Layers, Share2, SearchCheck, HandCoins, MessageSquare, Inbox, Hotel, Cpu } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Travelers & Users", icon: UserCheck },
  { to: "/admin/ai", label: "AI Control & Analytics", icon: Cpu, badge: "NEW" },
  {
    label: "CMS Engine",
    icon: Layers,
    subItems: [
      { to: "/admin/landing-cms", label: "Landing Page CMS", icon: LayoutTemplate },
      { to: "/admin/kyc-cms", label: "KYC Template CMS", icon: FileCheck },
      { to: "/admin/vendor-guide", label: "Vendor Guide CMS", icon: BookOpen },
    ],
  },
  { to: "/admin/whatsapp", label: "WhatsApp Console", icon: MessageSquare, badge: "LIVE" },
  { to: "/admin/leads", label: "Leads & Inquiries", icon: Inbox, badge: "HOT" },
  { to: "/admin/custom-leads", label: "Custom Tour Leads", icon: Compass },
  { to: "/admin/custom-visa", label: "Custom Visa Leads", icon: FileCheck, badge: "HOT" },
  { to: "/admin/vendors", label: "Vendors & Subscriptions", icon: Users },
  { to: "/admin/subscriptions", label: "Subscription Plans", icon: Sparkles },
  { to: "/admin/tours", label: "Tours Catalog", icon: Globe2 },
  { to: "/admin/services", label: "Services Catalog", icon: Boxes },
  { to: "/admin/payments", label: "Payment gateways", icon: CreditCard },
  { to: "/admin/affiliates", label: "Affiliate Program", icon: Share2 },
  { to: "/admin/affiliate-payouts", label: "Affiliate Payouts", icon: HandCoins, badge: "FRI" },
  { to: "/admin/seo", label: "SEO Optimization", icon: SearchCheck, badge: "NEW" },
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
