import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminResetUserPassword } from "@/lib/vendors.functions";

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

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);
  const [lastResetPassword, setLastResetPassword] = React.useState("");

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return adminResetUserPassword({ data: { userId, newPassword } });
    },
    onSuccess: () => {
      toast.success(`Password reset successfully for ${selectedUser?.email || "user"}!`);
      setResetSuccess(true);
      setLastResetPassword(newPassword);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reset password.");
    },
  });

  function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "Gpk@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  }

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
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword("");
                              setResetSuccess(false);
                              setLastResetPassword("");
                              setResetModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition shadow-xs"
                            title="Reset Account Password"
                          >
                            <KeyRound className="size-3.5" />
                            <span>Reset Pass</span>
                          </button>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Assalam-o-Alaikum ${u.full_name || "Traveler"},\n\nThis is the GlobeTrek PK Platform Admin reaching out regarding your account (${u.email}).`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20 transition"
                            title="WhatsApp Message"
                          >
                            <MessageCircle className="size-4" />
                          </a>

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

      {/* Admin Password Reset Dialog */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border text-foreground p-6 sm:p-7 shadow-2xl rounded-2xl">
          <DialogHeader className="text-left">
            <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Reset Account Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Directly update the Supabase Auth password for this user without requiring email confirmations or token links.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-surface p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{selectedUser.full_name || "User"}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="text-muted-foreground font-mono">{selectedUser.email}</div>
              </div>

              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-200">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span>Password Updated Successfully!</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80">
                      The password for <strong>{selectedUser.email}</strong> is now set to:
                    </p>
                    <div className="bg-black/40 border border-emerald-500/30 rounded-lg p-2.5 font-mono text-sm text-emerald-200 tracking-wider text-center select-all">
                      {lastResetPassword}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Assalam-o-Alaikum ${selectedUser.full_name || "Traveler"},\n\nYour GlobeTrek PK password has been reset by the platform administrator.\n\n📧 Login Email: ${selectedUser.email}\n🔑 New Password: ${lastResetPassword}\n🌐 Login URL: https://globetrek.pk/auth\n\nBest regards,\nGlobeTrek PK Admin Desk`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition"
                  >
                    <MessageCircle className="size-4" />
                    <span>Send New Password via WhatsApp</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResetModalOpen(false)}
                    className="w-full text-xs h-9"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPassword || newPassword.length < 6) {
                      toast.error("Password must be at least 6 characters.");
                      return;
                    }
                    resetPasswordMutation.mutate({
                      userId: selectedUser.id,
                      newPassword: newPassword.trim(),
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-new-password" className="text-xs font-semibold">
                        Set New Password*
                      </Label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                      >
                        <Sparkles className="size-3" /> Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="admin-new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter at least 6 characters (e.g. Travel@2026)"
                        className="pr-10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResetModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={resetPasswordMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-1.5 size-4" /> Save New Password
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
