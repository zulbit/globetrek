import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Shield, Ticket, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/services";

export function CrossSellPanel({ destinationCountry }: { destinationCountry: string }) {
  const { data } = useQuery({
    queryKey: ["cross-sell", destinationCountry],
    queryFn: async () => {
      const [visa, insurance, tickets] = await Promise.all([
        supabase.from("visa_services")
          .select("id, country, visa_type, processing_days, price_pkr, service_fee_pkr")
          .eq("is_active", true)
          .ilike("country", `%${destinationCountry}%`)
          .limit(2),
        supabase.from("insurance_plans")
          .select("id, plan_name, coverage_type, duration_days, price_pkr")
          .eq("is_active", true)
          .limit(2),
        supabase.from("ticket_services")
          .select("id, service_name, route_type, service_fee_pkr")
          .eq("is_active", true)
          .eq("route_type", "International")
          .limit(1),
      ]);
      return {
        visa: visa.data ?? [],
        insurance: insurance.data ?? [],
        tickets: tickets.data ?? [],
      };
    },
  });

  if (!data) return null;
  const hasAny = data.visa.length + data.insurance.length + data.tickets.length > 0;
  if (!hasAny) return null;

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Complete your trip</h2>
        <p className="text-xs text-muted-foreground">
          Add-on services from GlobeTrek PK verified providers — inquire directly, no commitment.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.visa.map((v) => (
          <Link
            key={v.id}
            to="/visa/$id"
            params={{ id: v.id }}
            className="group flex items-start justify-between gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 transition hover:border-sky-500/60"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                <FileCheck className="size-3.5" /> Visa
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{v.country} · {v.visa_type}</div>
              <div className="text-xs text-muted-foreground">
                {v.processing_days} days · {formatPKR(v.price_pkr + (v.service_fee_pkr ?? 0))}
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-sky-400 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
        {data.insurance.map((p) => (
          <Link
            key={p.id}
            to="/insurance/$id"
            params={{ id: p.id }}
            className="group flex items-start justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 transition hover:border-emerald-500/60"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                <Shield className="size-3.5" /> Insurance
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{p.plan_name}</div>
              <div className="text-xs text-muted-foreground">
                {p.coverage_type} · {p.duration_days}d · {formatPKR(p.price_pkr)}
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-emerald-400 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
        {data.tickets.map((t) => (
          <Link
            key={t.id}
            to="/tickets/$id"
            params={{ id: t.id }}
            className="group flex items-start justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 transition hover:border-amber-500/60"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                <Ticket className="size-3.5" /> Tickets
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{t.service_name}</div>
              <div className="text-xs text-muted-foreground">
                {t.route_type} · fee {formatPKR(t.service_fee_pkr)}
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-amber-400 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}
