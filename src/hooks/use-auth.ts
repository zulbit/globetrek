import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "vendor" | "customer";

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  isImpersonating?: boolean;
  originalUser?: User | null;
  originalRole?: AppRole | null;
  impersonatedCompany?: string | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Impersonation state
  const [impersonatedId, setImpersonatedId] = useState<string | null>(null);
  const [impersonatedCompany, setImpersonatedCompany] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setImpersonatedId(localStorage.getItem("gtpk.impersonated_vendor_id"));
      setImpersonatedCompany(localStorage.getItem("gtpk.impersonated_vendor_company"));
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setImpersonatedId(localStorage.getItem("gtpk.impersonated_vendor_id"));
      setImpersonatedCompany(localStorage.getItem("gtpk.impersonated_vendor_company"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const best: AppRole | null = roles.includes("admin")
        ? "admin"
        : roles.includes("vendor")
          ? "vendor"
          : roles.includes("customer")
            ? "customer"
            : null;
      setRole(best);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const actualUser = session?.user ?? null;
  // Impersonation is only allowed for real admin users
  const isImpersonating = !!(actualUser && role === "admin" && impersonatedId);

  const effectiveUser = isImpersonating && actualUser
    ? { ...actualUser, id: impersonatedId }
    : actualUser;

  const effectiveRole = isImpersonating ? ("vendor" as AppRole) : role;

  return {
    session,
    user: effectiveUser,
    role: effectiveRole,
    loading,
    isImpersonating,
    originalUser: actualUser,
    originalRole: role,
    impersonatedCompany,
  };
}
