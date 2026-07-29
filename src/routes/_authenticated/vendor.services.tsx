import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, FileCheck, Shield, Ticket, Globe2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateVendorServices } from "@/lib/services.functions";

export const Route = createFileRoute("/_authenticated/vendor/services")({
  component: VendorServicesOffered,
});

const OPTIONS = [
  { id: "tours",     label: "Tour packages",   desc: "Curated international itineraries with dates, seats, itinerary.", icon: Globe2,    tone: "text-primary" },
  { id: "visa",      label: "Visa services",   desc: "Country-specific visa filing, document review, embassy liaison.",  icon: FileCheck, tone: "text-sky-400" },
  { id: "insurance", label: "Travel insurance",desc: "Schengen, medical, family & adventure travel insurance plans.",    icon: Shield,    tone: "text-emerald-400" },
  { id: "tickets",   label: "Flight tickets",  desc: "Domestic, international, Umrah & Hajj ticketing services.",        icon: Ticket,    tone: "text-amber-400" },
];

function VendorServicesOffered() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(updateVendorServices);

  const { data: fullProfile, isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-services", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("vendor_services, company_name, subscription_tier, phone, city, vendor_status").eq("id", user!.id).maybeSingle();
      if (data && !isKycLoaded) {
        setCompanyName(data.company_name || "");
        setPhone(data.phone || "");
        setCity(data.city || "");
        setIsKycLoaded(true);
      }
      return data;
    },
  });

  const [selected, setSelected] = useState<string[]>([]);
  const current = (fullProfile?.vendor_services as string[] | null) ?? ["tours"];
  const value = selected.length ? selected : current;

  const mutation = useMutation({
    mutationFn: (services: string[]) => save({ data: { services } }),
    onSuccess: () => {
      toast.success("Service categories updated");
      qc.invalidateQueries({ queryKey: ["vendor-services"] });
      qc.invalidateQueries({ queryKey: ["vendor-services-nav"] });
      setSelected([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const kycMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          phone,
          city,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("KYC Details Submitted to Admin!", {
        description: "Your agency verification request is being reviewed by GlobeTrek PK Admins.",
      });
      qc.invalidateQueries({ queryKey: ["vendor-services-kyc"] });
      qc.invalidateQueries({ queryKey: ["vendor-services-nav"] });
    },
    onError: (e: any) => toast.error(`KYC save failed: ${e.message}`),
  });

  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id); else set.add(id);
    setSelected(Array.from(set));
  }

  if (isLoading) {
    return <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Service Categories Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground">Services Offered by Agency</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select category desks offered by your travel desk to activate corresponding navigation menus.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const checked = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  checked
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-surface/40 text-muted-foreground hover:bg-surface"
                }`}
              >
                <Icon className={`size-5 shrink-0 mt-0.5 ${opt.tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{opt.label}</span>
                    {checked && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            disabled={mutation.isPending || !selected.length}
            onClick={() => mutation.mutate(value)}
            className="font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5"
          >
            {mutation.isPending ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Saving…</> : "Save Service Categories"}
          </Button>
        </div>
      </div>

      {/* Vendor KYC Verification Form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <FileCheck className="size-4" /> Agency Verification &amp; License (KYC)
            </div>
            <h2 className="text-lg font-bold text-foreground">Vendor Business Verification Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit your official travel agency credentials for Admin verification &amp; verified badge issuance.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
            fullProfile?.vendor_status === "approved"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {fullProfile?.vendor_status === "approved" ? "✅ Verified Agency" : "⏳ KYC Review Pending"}
          </span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); kycMutation.mutate(); }} className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Agency Legal Name*</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Skylark Travels & Tours (Pvt) Ltd"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Mobile / WhatsApp Support Number*</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">DTS License No. / Registration</label>
              <input
                type="text"
                value={dtsLicense}
                onChange={(e) => setDtsLicense(e.target.value)}
                placeholder="e.g. DTS-LHR-9410"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">FBR Tax ID / NTN Number</label>
              <input
                type="text"
                value={ntnNumber}
                onChange={(e) => setNtnNumber(e.target.value)}
                placeholder="e.g. NTN-8941029-7"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Primary Office City*</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Karachi, Islamabad"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Owner CNIC Number</label>
              <input
                type="text"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                placeholder="e.g. 35202-1234567-1"
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-muted-foreground block mb-1">Physical Office Address</label>
            <input
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="e.g. Suite 402, Main Boulevard, Gulberg III, Lahore"
              className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={kycMutation.isPending}
              className="font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 rounded-xl px-5 gap-1.5"
            >
              {kycMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <FileCheck className="size-3.5" />}
              Submit KYC Verification Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
