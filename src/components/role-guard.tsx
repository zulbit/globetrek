import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";

export function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
}
