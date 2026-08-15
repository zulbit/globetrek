import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileCheck, Loader2, ShieldCheck, CheckCircle2, Clock, Sparkles, Building2, Phone, MapPin, CreditCard, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getKYCTemplateSettings,
  submitVendorKYC,
  getVendorKYCDetails,
  type KYCTemplateSettings,
  type KYCFieldConfig,
} from "@/lib/kyc.functions";

export const Route = createFileRoute("/_authenticated/vendor/kyc")({
  component: VendorKYCPage,
});

function VendorKYCPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const fetchTemplateFn = useServerFn(getKYCTemplateSettings);
  const submitKYCFn = useServerFn(submitVendorKYC);

  // Fetch KYC Template Settings
  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["kyc-template-settings"],
    queryFn: () => fetchTemplateFn(),
  });

  const fetchKYCDetailsFn = useServerFn(getVendorKYCDetails);

  // Fetch vendor profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-kyc-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, city, vendor_status")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Fetch previously submitted KYC payload
  const { data: existingKyc } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-kyc-existing", user?.id],
    queryFn: () => fetchKYCDetailsFn({ data: { userId: user!.id } }),
  });

  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [isUnlockedForRevetting, setIsUnlockedForRevetting] = React.useState(false);

  React.useEffect(() => {
    if (profile || existingKyc || user) {
      const kycFields = existingKyc?.fields || {};
      const authPhone = (user?.user_metadata?.phone as string) || "";
      setFormData((prev) => ({
        company_name: prev.company_name || profile?.company_name || kycFields.company_name || "",
        city: prev.city || profile?.city || kycFields.city || "",
        phone: prev.phone || kycFields.phone || authPhone || "",
        ...kycFields,
        // Keep whatever the user may have manually typed in the current session
        ...(prev.phone ? { phone: prev.phone } : {}),
        ...(prev.company_name ? { company_name: prev.company_name } : {}),
        ...(prev.city ? { city: prev.city } : {}),
      }));
    }
  }, [profile, existingKyc, user]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      return submitKYCFn({
        data: {
          userId: user.id,
          profileUpdates: formData,
        },
      });
    },
    onSuccess: () => {
      if (isApproved) {
        toast.success("Agency Credentials Updated!", {
          description: "Your business details and payout settings have been saved.",
        });
      } else {
        toast.success("Verification Details Submitted to Admin!", {
          description: "GlobeTrek PK Admins will review your agency license & credentials within 24 hours.",
        });
      }
      qc.invalidateQueries({ queryKey: ["vendor-kyc-profile"] });
      qc.invalidateQueries({ queryKey: ["vendor-kyc-existing"] });
      qc.invalidateQueries({ queryKey: ["vendor-services-nav"] });
      qc.invalidateQueries({ queryKey: ["vendor-overview"] });
    },
    onError: (err: any) => {
      toast.error(`Submission error: ${err.message}`);
    },
  });

  const isApproved = profile?.vendor_status === "approved" || existingKyc?.status === "approved";
  const isSubmitted = !isApproved && (existingKyc?.status === "submitted" || !!existingKyc?.isSubmitted);
  const isNotSubmitted = !isApproved && !isSubmitted;

  if (isTemplateLoading || isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mb-2" />
        <p className="text-sm">Loading Verification Portal…</p>
      </div>
    );
  }
  const enabledFields = (template?.fields || []).filter((f) => f.enabled);

  function formatCNIC(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }

  function handleInputChange(id: string, value: string) {
    const nextVal = id === "cnic_number" ? formatCNIC(value) : value;
    setFormData((prev) => ({ ...prev, [id]: nextVal }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate mandatory required fields
    for (const field of enabledFields) {
      if (field.required && !formData[field.id]?.trim()) {
        toast.error(`Missing Required Field: Please provide ${field.label}.`);
        return;
      }
    }

    // CNIC / NIC 13-digit format validation
    if (formData["cnic_number"]) {
      const digitsOnly = formData["cnic_number"].replace(/\D/g, "");
      if (digitsOnly.length !== 13) {
        toast.error("Invalid CNIC / NIC Number: Please enter a valid 13-digit Pakistani CNIC (e.g. 35202-1234567-1).");
        return;
      }
    }

    submitMutation.mutate();
  }

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <FileCheck className="size-4" /> Agency Verification &amp; License (KYC)
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Agency KYC Verification Portal
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
              {template?.instructions || "Please submit your official business registration and tax documents to complete agency verification."}
            </p>
          </div>

          <Badge
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
              isApproved
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : isSubmitted
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
            }`}
          >
            {isApproved
              ? "✅ Verified Agency Partner"
              : isSubmitted
              ? "⏳ KYC Submitted & Under Review"
              : "⚠️ Action Required: KYC Not Submitted"}
          </Badge>
        </div>

        {isApproved && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-emerald-300 font-bold block mb-0.5">Verified Agency Partner:</strong>
                Your agency credentials and DTS license have been verified by GlobeTrek PK Admins. You have full access to publish active packages and unlock traveler inquiries.
              </div>
            </div>

            {isUnlockedForRevetting && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3.5 text-xs text-amber-200">
                <AlertCircle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-amber-300 font-bold block mb-0.5">⚠️ Re-Vetting Mode Active:</strong>
                  You have unlocked your verified legal credentials. Modifying your DTS license number, license type, expiry date, NTN, CNIC, or agency name will put your agency under review for Admin re-vetting.
                </div>
              </div>
            )}
          </div>
        )}

        {isSubmitted && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <Clock className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-0.5">Application Submitted — Admin Review in Progress (24h SLA):</strong>
              Your verification credentials were submitted {existingKyc?.submittedAt ? `on ${new Date(existingKyc.submittedAt).toLocaleDateString()}` : "recently"}. GlobeTrek PK Admins are reviewing your DTS license and contact details. You will receive an automated WhatsApp confirmation once approved.
            </div>
          </div>
        )}

        {isNotSubmitted && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200">
            <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-rose-300 font-bold block mb-0.5">Verification Action Required:</strong>
              Your account is currently active in <span className="underline font-semibold">Setup Mode</span>. You can prepare drafts, but publishing live tour packages and unlocking traveler leads requires official verification. Please submit your DTS license number, NTN, and CNIC below.
            </div>
          </div>
        )}
      </div>

      {/* Dynamic KYC Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Required Business Credentials</h2>
            <span className="text-xs text-muted-foreground">
              Fields marked with <span className="text-rose-400 font-bold">*</span> are required by Admin
            </span>
          </div>

          {isApproved && (
            <div>
              {!isUnlockedForRevetting ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnlockedForRevetting(true)}
                  className="text-xs h-8 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold gap-1.5"
                >
                  🔓 Unlock to Update Legal Info
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnlockedForRevetting(false)}
                  className="text-xs h-8 border-border text-muted-foreground font-semibold gap-1.5"
                >
                  🔒 Lock Verified Credentials
                </Button>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid gap-5 sm:grid-cols-2">
            {enabledFields.map((field) => {
              const isCritical = [
                "dts_license",
                "dts_license_type",
                "dts_expiry_date",
                "ntn_number",
                "cnic_number",
                "company_name",
              ].includes(field.id);

              const hasExistingValue = Boolean((existingKyc?.fields?.[field.id] || "").trim());
              const isLocked = isApproved && isCritical && hasExistingValue && !isUnlockedForRevetting;

              const isDate = field.id === "dts_expiry_date" || field.type === "date";
              const isSelect = field.id === "dts_license_type" || field.type === "select";

              const selectOptions = field.options || [
                "International Packages & Group Tours",
                "Hajj & Umrah Packages",
                "Air Tickets & Passenger Booking Only",
                "Domestic Tours & Northern Areas",
                "Full Comprehensive Travel & Tourism Agency",
              ];

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {field.label} {field.required && <span className="text-rose-400 font-bold">*</span>}
                    </span>
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                        🔒 Verified &amp; Locked
                      </span>
                    ) : isApproved && isCritical && !hasExistingValue ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                        ✨ Required Update
                      </span>
                    ) : null}
                  </label>

                  {isSelect ? (
                    <select
                      required={field.required}
                      disabled={isLocked}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full text-xs text-foreground h-9 rounded-xl px-3 outline-none transition-colors ${
                        isLocked
                          ? "bg-surface/50 border border-border/50 text-muted-foreground cursor-not-allowed opacity-80"
                          : "bg-surface border border-border focus:border-primary"
                      }`}
                    >
                      <option value="" disabled>
                        -- Select DTS License Type / Operation --
                      </option>
                      {selectOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-card text-foreground">
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={isDate ? "date" : field.id === "phone" ? "tel" : "text"}
                      required={field.required}
                      disabled={isLocked}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`text-xs text-foreground h-9 rounded-xl placeholder:text-muted-foreground ${
                        isLocked
                          ? "bg-surface/50 border-border/50 text-muted-foreground cursor-not-allowed opacity-80"
                          : "bg-surface border-border focus:border-primary"
                      }`}
                    />
                  )}

                  {isLocked ? (
                    <p className="text-[11px] text-amber-400/90 leading-tight">
                      Verified government credential. Click "Unlock to Update Legal Info" to submit modifications for Admin review.
                    </p>
                  ) : field.description ? (
                    <p className="text-[11px] text-muted-foreground leading-tight">{field.description}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Submitted information is strictly processed for GlobeTrek PK Admin verification.
            </p>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs rounded-xl px-6 h-10 gap-1.5 shadow-md"
            >
              {submitMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {isApproved ? "Update Verification Info" : "Submit KYC for Admin Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
