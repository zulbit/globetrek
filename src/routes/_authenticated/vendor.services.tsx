import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, FileCheck, Shield, Ticket, Globe2, Loader2, ArrowRight } from "lucide-react";
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
        .select("vendor_services, vendor_status").eq("id", user!.id).maybeSingle();
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

  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id); else set.add(id);
    setSelected(Array.from(set));
  }

  if (isLoading) {
    return <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Service Categories Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
        <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Services Offered by Agency</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select category desks offered by your travel desk to activate corresponding navigation menus.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
            fullProfile?.vendor_status === "approved"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {fullProfile?.vendor_status === "approved" ? "✅ Verified Agency" : "⏳ KYC Pending"}
          </span>
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

      {/* Quick Link to Dedicated KYC Page */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <FileCheck className="size-4" /> Agency Verification &amp; Licensing
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need to submit or update your DTS License, NTN, CNIC, and business documents for verified badge approval?
          </p>
        </div>
        <Link to="/vendor/kyc">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs gap-1.5 rounded-xl shrink-0">
            Go to Agency Verification (KYC) <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
