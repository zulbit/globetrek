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

  const { data: profile, isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-services", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("vendor_services, company_name, subscription_tier").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [selected, setSelected] = useState<string[]>([]);
  const current = (profile?.vendor_services as string[] | null) ?? ["tours"];
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Services you offer</h2>
        <p className="text-sm text-muted-foreground">
          Enable the categories your business handles. Each enabled category unlocks a dedicated
          management screen and adds you to the relevant public marketplace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const on = value.includes(o.id);
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                on ? "border-primary/60 bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`grid size-10 place-items-center rounded-xl bg-surface ring-1 ring-border ${o.tone}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{o.label}</div>
                  {on && <CheckCircle2 className="size-4 text-primary" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{o.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface/50 p-4">
        <div className="text-xs text-muted-foreground">
          Currently enabled:{" "}
          <span className="font-medium text-foreground">
            {value.map((v) => OPTIONS.find((o) => o.id === v)?.label ?? v).join(" · ")}
          </span>
        </div>
        <Button
          disabled={mutation.isPending || selected.length === 0}
          onClick={() => mutation.mutate(value)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
