import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UserCheck,
  Search,
  Mail,
  Calendar,
  Compass,
  Shield,
  Loader2,
  Users,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  phone: string | null;
  created_at: string;
  role: string;
  custom_leads_count?: number;
  inquiries_count?: number;
}

function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "customer" | "admin" | "vendor">("all");

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      // 1. Fetch profiles and roles
      const [profilesRes, rolesRes, customLeadsRes, leadsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, city, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("custom_tour_leads").select("contact_email"),
        supabase.from("leads").select("customer_email"),
      ]);

      const profiles = profilesRes.data ?? [];
      const rolesMap: Record<string, string> = {};
      (rolesRes.data ?? []).forEach((r) => {
        rolesMap[r.user_id] = r.role;
      });

      // Count custom leads and inquiries per email
      const customLeadsCountMap: Record<string, number> = {};
      (customLeadsRes.data ?? []).forEach((cl) => {
        if (cl.contact_email) {
          const emailLower = cl.contact_email.toLowerCase();
          customLeadsCountMap[emailLower] = (customLeadsCountMap[emailLower] || 0) + 1;
        }
      });

      const inquiriesCountMap: Record<string, number> = {};
      (leadsRes.data ?? []).forEach((l) => {
        if (l.customer_email) {
          const emailLower = l.customer_email.toLowerCase();
          inquiriesCountMap[emailLower] = (inquiriesCountMap[emailLower] || 0) + 1;
        }
      });

      const userProfiles: UserProfile[] = profiles.map((p) => {
        const userEmail = (p.email || "").toLowerCase();
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          city: p.city,
          phone: null,
          created_at: p.created_at || new Date().toISOString(),
          role: rolesMap[p.id] || "customer",
          custom_leads_count: customLeadsCountMap[userEmail] || 0,
          inquiries_count: inquiriesCountMap[userEmail] || 0,
        };
      });

      return userProfiles;
    },
    refetchInterval: 10000,
  });

  const filtered = React.useMemo(() => {
    return (users ?? []).filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const customerCount = (users ?? []).filter((u) => u.role === "customer").length;
  const adminCount = (users ?? []).filter((u) => u.role === "admin").length;
  const vendorCount = (users ?? []).filter((u) => u.role === "vendor").length;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header & Metric Highlights */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <UserCheck className="size-7 text-primary" />
            Registered Travelers &amp; User Accounts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all verified customer accounts, traveler profiles, and system users.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start sm:self-auto">
          Refresh List
        </Button>
      </div>

      {/* Role Tabs & Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setRoleFilter("customer")}
          className={`rounded-2xl border p-4 text-left transition ${
            roleFilter === "customer"
              ? "border-sky-500 bg-sky-500/10 shadow-glow"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Travelers (Customers)</span>
            <Users className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-400">{customerCount}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Registered customer profiles</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter("vendor")}
          className={`rounded-2xl border p-4 text-left transition ${
            roleFilter === "vendor"
              ? "border-emerald-500 bg-emerald-500/10 shadow-glow"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Vendor Partners</span>
            <Crown className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{vendorCount}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Travel agencies &amp; operators</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={`rounded-2xl border p-4 text-left transition ${
            roleFilter === "all"
              ? "border-primary bg-primary/10 shadow-glow"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Total Accounts</span>
            <Shield className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{(users ?? []).length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Includes {adminCount} platform admin(s)</p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <Search className="ml-2 size-4 text-muted-foreground shrink-0" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, city, or role..."
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
        />
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="h-8 px-2 text-xs">
            Clear
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Loading traveler accounts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <UserCheck className="mx-auto size-10 opacity-40 mb-3" />
            <p className="font-semibold text-foreground">No accounts found</p>
            <p className="mt-1 text-xs">Try adjusting your search query or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Account Role</th>
                  <th className="px-6 py-4">City / Location</th>
                  <th className="px-6 py-4">Tour Activity</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((u) => {
                  const initials = (u.full_name || u.email || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const totalActivity = (u.custom_leads_count || 0) + (u.inquiries_count || 0);

                  return (
                    <tr key={u.id} className="transition hover:bg-surface/30">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 font-bold text-primary text-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {u.full_name || "Traveler Account"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-0.5">
                              <Mail className="size-3" />
                              {u.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        {u.role === "admin" ? (
                          <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            👑 Platform Admin
                          </Badge>
                        ) : u.role === "vendor" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🏢 Travel Vendor
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            🧳 Traveler (Customer)
                          </Badge>
                        )}
                      </td>

                      {/* City */}
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {u.city || "Pakistan"}
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        {totalActivity > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                              <Compass className="size-3.5" />
                              {u.custom_leads_count || 0} Custom Tour(s)
                            </span>
                            {u.inquiries_count ? (
                              <div className="text-[11px] text-muted-foreground">
                                + {u.inquiries_count} Direct Inquiries
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No leads yet</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {new Date(u.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`mailto:${u.email}`}
                            className="rounded-lg border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary transition"
                            title="Send Email"
                          >
                            <Mail className="size-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
