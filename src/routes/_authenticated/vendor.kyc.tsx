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
  const [isFormInitialized, setIsFormInitialized] = React.useState(false);

  React.useEffect(() => {
    if (profile && !isFormInitialized) {
      setFormData({
        company_name: profile.company_name || "",
        city: profile.city || "",
        ...(existingKyc || {}),
      });
      if (existingKyc || profile.company_name) {
        setIsFormInitialized(true);
      }
    }
  }, [profile, existingKyc, isFormInitialized]);

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
      toast.success("Verification Details Submitted to Admin!", {
        description: "GlobeTrek PK Admins will review your agency license & credentials within 24 hours.",
      });
      qc.invalidateQueries({ queryKey: ["vendor-kyc-profile"] });
      qc.invalidateQueries({ queryKey: ["vendor-services-nav"] });
    },
    onError: (err: any) => {
      toast.error(`Submission error: ${err.message}`);
    },
  });

  if (isTemplateLoading || isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mb-2" />
        <p className="text-sm">Loading Verification Portal…</p>
      </div>
    );
  }

  const enabledFields = (template?.fields || []).filter((f) => f.enabled);
  const isApproved = profile?.vendor_status === "approved";

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
    for (const f of enabledFields) {
      if (f.required && !formData[f.id]?.trim()) {
        toast.error(`"${f.label}" is required for agency verification.`);
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
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}
          >
            {isApproved ? "✅ Verified Agency Partner" : "⏳ KYC Under Review"}
          </Badge>
        </div>

        {!isApproved && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <Clock className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-0.5">Verification Timeline &amp; Access:</strong>
              Your agency account is active in setup mode. Once you submit the required verification details below, GlobeTrek PK Admins verify DTS licenses and WhatsApp numbers within 24 hours to issue your Verified Partner badge.
            </div>
          </div>
        )}
      </div>

      {/* Dynamic KYC Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Required Business Credentials</h2>
          <span className="text-xs text-muted-foreground">
            Fields marked with <span className="text-rose-400 font-bold">*</span> are required by Admin
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid gap-5 sm:grid-cols-2">
            {enabledFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>
                    {field.label} {field.required && <span className="text-rose-400 font-bold">*</span>}
                  </span>
                </label>

                <Input
                  type={field.id === "phone" ? "tel" : "text"}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="bg-surface border-border text-xs text-foreground h-9 rounded-xl placeholder:text-muted-foreground"
                />

                {field.description && (
                  <p className="text-[11px] text-muted-foreground leading-tight">{field.description}</p>
                )}
              </div>
            ))}
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
