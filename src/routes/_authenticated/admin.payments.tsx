import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, ShieldCheck, Webhook, Info } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getGatewaySettings, setGatewayEnabled } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getGatewaySettings);
  const toggleFn = useServerFn(setGatewayEnabled);

  const { data, isLoading } = useQuery({
    queryKey: ["gateway-settings"],
    queryFn: () => fetchSettings(),
  });

  const toggle = useMutation({
    mutationFn: (vars: { provider: string; enabled: boolean }) => toggleFn({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(`SafePay ${vars.enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["gateway-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const safepay = data?.find((s) => s.provider === "safepay");
  const enabled = safepay?.enabled ?? false;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Payment gateways</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enable or disable payment providers available to customers at checkout.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">SafePay</h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    enabled
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {enabled ? "Live" : "Disabled"}
                </span>
              </div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Debit/Credit cards, EasyPaisa & JazzCash in PKR via SafePay QuickLinks V2.
                Environment: <span className="font-mono">{safepay ? "configured" : "—"}</span>
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            disabled={isLoading || toggle.isPending}
            onCheckedChange={(v) => toggle.mutate({ provider: "safepay", enabled: v })}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<ShieldCheck className="size-4" />}
            title="Secrets required"
            body="SAFEPAY_API_KEY, SAFEPAY_SECRET_KEY, SAFEPAY_WEBHOOK_SECRET, SAFEPAY_ENV"
          />
          <InfoTile
            icon={<Webhook className="size-4" />}
            title="Webhook endpoint"
            body="/api/public/safepay-webhook"
          />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Disabling SafePay hides the “Pay online” action across all tour and service pages.
            Existing pending checkouts continue to fulfill via webhook.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <p className="mt-1.5 break-words font-mono text-xs text-foreground/80">{body}</p>
    </div>
  );
}
