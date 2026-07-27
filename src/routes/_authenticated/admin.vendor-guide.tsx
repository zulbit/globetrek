import { createFileRoute } from "@tanstack/react-router";
import { AdminVendorGuideEditor } from "@/components/admin/vendor-guide-editor";

export const Route = createFileRoute("/_authenticated/admin/vendor-guide")({
  component: AdminVendorGuidePage,
});

function AdminVendorGuidePage() {
  return <AdminVendorGuideEditor />;
}
