import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileCheck, Loader2, Save, Plus, Trash2, ShieldCheck, Check, ToggleLeft, ToggleRight, Sparkles, AlertCircle, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getKYCTemplateSettings,
  saveKYCTemplateSettings,
  type KYCTemplateSettings,
  type KYCFieldConfig,
} from "@/lib/kyc.functions";

export const Route = createFileRoute("/_authenticated/admin/kyc-cms")({
  component: AdminKYCCMS,
});

function AdminKYCCMS() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getKYCTemplateSettings);
  const saveSettings = useServerFn(saveKYCTemplateSettings);

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["kyc-template-settings"],
    queryFn: () => fetchSettings(),
  });

  const [settings, setSettings] = React.useState<KYCTemplateSettings | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setSettings(initialData);
    }
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: (data: KYCTemplateSettings) => saveSettings({ data }),
    onSuccess: () => {
      toast.success("KYC Verification Template Published!", {
        description: "Vendors will now see these dynamic required fields on their verification portal.",
      });
      qc.invalidateQueries({ queryKey: ["kyc-template-settings"] });
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mb-2" />
        <p className="text-sm">Loading KYC Template CMS…</p>
      </div>
    );
  }

  function updateField(id: string, updates: Partial<KYCFieldConfig>) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      };
    });
  }

  function toggleFieldEnabled(id: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
      };
    });
  }

  function toggleFieldRequired(id: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => (f.id === id ? { ...f, required: !f.required } : f)),
      };
    });
  }

  function addCustomField() {
    const customId = `custom_${Date.now()}`;
    const newField: KYCFieldConfig = {
      id: customId,
      label: "Custom Requirement Question",
      placeholder: "e.g. Provide IATA registration or reference number",
      required: false,
      enabled: true,
      description: "Additional business detail required from agency.",
    };
    setSettings((prev) => (prev ? { ...prev, fields: [...prev.fields, newField] } : prev));
  }

  function removeField(id: string) {
    setSettings((prev) => (prev ? { ...prev, fields: prev.fields.filter((f) => f.id !== id) } : prev));
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <ShieldCheck className="size-4" /> Admin Portal · KYC CMS
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Vendor Verification KYC Template</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
            Customize the business inputs, license requirements, and tax credentials requested from travel agencies during account verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Load official DTS Form II Travel Agency Rules (1977) fields into the template?")) {
                const dtsDefault = {
                  instructions: "Please submit your official business registration, DTS Form II license, and tax documents to complete agency verification on GlobeTrek PK.",
                  auto_approval_enabled: false,
                  fields: [
                    {
                      id: "company_name",
                      label: "Agency / Business Legal Name",
                      placeholder: "e.g. Deluxe Holidays (Pvt) Ltd",
                      required: true,
                      enabled: true,
                      description: "Registered trade name of your travel desk.",
                      type: "text" as const,
                    },
                    {
                      id: "phone",
                      label: "Official WhatsApp Number",
                      placeholder: "e.g. +92 300 1234567",
                      required: true,
                      enabled: true,
                      description: "Direct WhatsApp number for instant booking alerts & traveler communication.",
                      type: "tel" as const,
                    },
                    {
                      id: "dts_license",
                      label: "DTS License No. / Registration",
                      placeholder: "e.g. DTS-3877 / KH-12345",
                      required: true,
                      enabled: true,
                      description: "Department of Tourist Services license number from Form II.",
                      type: "text" as const,
                    },
                    {
                      id: "dts_license_type",
                      label: "DTS License Type / Field of Operation",
                      placeholder: "Select permitted field of operation",
                      required: true,
                      enabled: true,
                      description: "Field of operation authorized under Section 3(3) of Travel Agencies Rules 1977.",
                      type: "select" as const,
                      options: [
                        "International Packages & Group Tours",
                        "Hajj & Umrah Packages",
                        "Air Tickets & Passenger Booking Only",
                        "Domestic Tours & Northern Areas",
                        "Full Comprehensive Travel & Tourism Agency",
                      ],
                    },
                    {
                      id: "dts_expiry_date",
                      label: "DTS License Expiry Date",
                      placeholder: "YYYY-MM-DD",
                      required: true,
                      enabled: true,
                      description: "Valid renewal expiry date printed on your DTS license form.",
                      type: "date" as const,
                    },
                    {
                      id: "ntn_number",
                      label: "FBR Tax ID / NTN Number",
                      placeholder: "e.g. NTN-8941029-7",
                      required: true,
                      enabled: true,
                      description: "Federal Board of Revenue 7-digit tax number.",
                      type: "text" as const,
                    },
                    {
                      id: "cnic_number",
                      label: "Business Owner CNIC Number",
                      placeholder: "e.g. 35202-1234567-1",
                      required: true,
                      enabled: true,
                      description: "13-digit national identity card number of proprietor.",
                      type: "text" as const,
                    },
                    {
                      id: "city",
                      label: "Primary Operating City",
                      placeholder: "e.g. Lahore, Karachi, Islamabad",
                      required: true,
                      enabled: true,
                      description: "City where main physical office is located.",
                      type: "text" as const,
                    },
                    {
                      id: "office_address",
                      label: "Physical Office Address",
                      placeholder: "e.g. Office # 311, Balad Trade Centre, BMCHS, Karachi",
                      required: true,
                      enabled: true,
                      description: "Complete street address of agency office.",
                      type: "text" as const,
                    },
                    {
                      id: "bank_iban",
                      label: "Bank IBAN / Account Title",
                      placeholder: "e.g. PK36 HABB 0001 2345 6789 0102",
                      required: false,
                      enabled: true,
                      description: "Account details for vendor payout settlements.",
                      type: "text" as const,
                    },
                  ],
                };
                setSettings(dtsDefault);
                saveMutation.mutate(dtsDefault);
              }
            }}
            className="text-xs h-10 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 font-bold gap-1.5"
          >
            <Sparkles className="size-3.5" /> Reset to DTS Standards
          </Button>

          <Button
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(settings)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl px-5 h-10 gap-1.5 shadow-md"
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Publish KYC Template Live
          </Button>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Instructions & Policies */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" /> Vendor Onboarding Banner Note
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This message appears at the top of the vendor's KYC submission screen to guide them through verification.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Verification Instructions</label>
              <Textarea
                rows={4}
                value={settings.instructions}
                onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                className="bg-surface text-xs text-foreground placeholder:text-muted-foreground border-border"
                placeholder="Write instructions for vendors..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-400" />
                <h4 className="text-xs font-bold text-foreground">How Vendors See This</h4>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] uppercase font-mono">
                Live Dynamic Form
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When a vendor opens their dashboard (`/vendor/kyc`), the form automatically renders only the fields enabled below, marking mandatory items with red asterisks (*).
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic KYC Fields List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">KYC Inputs &amp; License Requirements</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomField}
              className="text-xs font-bold rounded-xl border-border bg-surface hover:bg-surface/80 text-foreground gap-1.5"
            >
              <Plus className="size-3.5" /> Add Requirement Field
            </Button>
          </div>

          <div className="space-y-3">
            {settings.fields.map((field) => (
              <div
                key={field.id}
                className={`rounded-2xl border p-4 space-y-3 transition ${
                  field.enabled
                    ? "border-border bg-card shadow-xs"
                    : "border-border/40 bg-surface/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[9px] uppercase font-mono font-bold ${
                        field.enabled
                          ? field.required
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-muted/30 text-muted-foreground border-border"
                      }`}
                    >
                      {field.enabled ? (field.required ? "Mandatory *" : "Optional") : "Disabled"}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-foreground">{field.id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground">
                      <span>Enabled</span>
                      <Switch
                        checked={field.enabled}
                        onCheckedChange={() => toggleFieldEnabled(field.id)}
                      />
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground">
                      <span>Required</span>
                      <Switch
                        checked={field.required}
                        disabled={!field.enabled}
                        onCheckedChange={() => toggleFieldRequired(field.id)}
                      />
                    </label>

                    {field.id.startsWith("custom_") && (
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-destructive hover:text-destructive/80 p-1"
                        title="Delete custom field"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Field Label Title</label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="bg-surface text-xs text-foreground border-border h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Input Placeholder Text</label>
                    <Input
                      value={field.placeholder}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="bg-surface text-xs text-foreground border-border h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Helper Note / Tooltip</label>
                  <Input
                    value={field.description || ""}
                    onChange={(e) => updateField(field.id, { description: e.target.value })}
                    className="bg-surface text-xs text-muted-foreground border-border h-8"
                    placeholder="Brief instruction for vendor filling this input..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
