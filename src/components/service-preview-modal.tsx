import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Eye, ArrowRight, Check, Plane, MapPin } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatEmbassyFee, isEmbassyFeeTBC, type VisaService, type InsurancePlan, type TicketService } from "@/lib/services";

type Common = { city?: string | null; vendor?: string | null };

type Props =
  | ({ kind: "visa"; row: VisaService } & Common)
  | ({ kind: "insurance"; row: InsurancePlan } & Common)
  | ({ kind: "tickets"; row: TicketService } & Common);

/** Small "Quick view" button; stops link navigation and opens a preview modal. */
export function ServicePreviewModal(props: Props) {
  const [open, setOpen] = React.useState(false);

  const title =
    props.kind === "visa"
      ? `${props.row.country} · ${props.row.visa_type} Visa`
      : props.kind === "insurance"
      ? props.row.plan_name
      : props.row.service_name;

  const detailTo =
    props.kind === "visa" ? "/visa/$id" : props.kind === "insurance" ? "/insurance/$id" : "/tickets/$id";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur hover:border-primary/40 hover:text-foreground"
          aria-label="Quick view details"
        >
          <Eye className="size-3.5" /> Sample
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-border bg-card p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {props.vendor ? <>by <span className="text-foreground font-medium">{props.vendor}</span></> : null}
            {props.city && (
              <span className="ml-2 inline-flex items-center gap-1"><MapPin className="size-3" /> {props.city}</span>
            )}
          </p>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {props.kind === "visa" && <VisaBody row={props.row} />}
          {props.kind === "insurance" && <InsuranceBody row={props.row} />}
          {props.kind === "tickets" && <TicketsBody row={props.row} />}
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="mr-auto">Close</Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to={detailTo} params={{ id: props.row.id }}>
              View full details <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Bodies ---------- */

function VisaBody({ row }: { row: VisaService }) {
  const feeTBC = isEmbassyFeeTBC(row.price_pkr);
  const allIn = row.price_pkr + (row.service_fee_pkr ?? 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Processing" value={`${row.processing_days} days`} />
        <Tile label="Success rate" value={row.success_rate ? `${row.success_rate}%` : "—"} />
        <Tile label={feeTBC ? "Service fee" : "All-in cost"} value={feeTBC ? formatPKR(row.service_fee_pkr) : formatPKR(allIn)} tone="text-highlight" />
      </div>
      <div className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted-foreground">
        Embassy fee: <span className={feeTBC ? "text-amber-400 font-medium" : "text-foreground"}>{formatEmbassyFee(row.price_pkr)}</span>
        {feeTBC && " — confirmed by consultant on inquiry (rates change frequently)."}
      </div>
      {row.description && <p className="text-sm text-foreground/90">{row.description}</p>}
      {row.documents_required?.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required documents</h4>
          <ul className="grid gap-1.5 rounded-xl border border-border bg-surface/40 p-3 sm:grid-cols-2">
            {row.documents_required.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" /> {d}
              </li>
            ))}
          </ul>
        </div>
      )}
      {row.extra_notes && (
        <p className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100/90">
          <span className="font-semibold text-amber-400">Notes:</span> {row.extra_notes}
        </p>
      )}
    </div>
  );
}

function InsuranceBody({ row }: { row: InsurancePlan }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Sum insured" value={formatPKR(row.coverage_amount_pkr)} tone="text-highlight" />
        <Tile label="Duration" value={`${row.duration_days} days`} />
        <Tile label="Age" value={`${row.age_min}–${row.age_max}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Coverage" value={row.coverage_type} />
        <Tile label="Price" value={formatPKR(row.price_pkr)} />
      </div>
      {row.description && <p className="text-sm text-foreground/90">{row.description}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {row.benefits?.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Benefits</h4>
            <ul className="space-y-1.5">
              {row.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" /> {b}</li>
              ))}
            </ul>
          </div>
        )}
        {row.exclusions?.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-400">Exclusions</h4>
            <ul className="space-y-1.5">
              {row.exclusions.map((b, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketsBody({ row }: { row: TicketService }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Route type" value={row.route_type} />
        <Tile label="Service fee" value={formatPKR(row.service_fee_pkr)} tone="text-highlight" />
        <Tile label="Refundable" value={row.refundable ? "Yes" : "No"} />
      </div>
      {row.description && <p className="text-sm text-foreground/90">{row.description}</p>}
      {row.airlines_supported?.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Airlines supported</h4>
          <div className="flex flex-wrap gap-1.5">
            {row.airlines_supported.map((a) => (
              <Badge key={a} variant="outline" className="rounded-full border-border bg-surface text-xs">{a}</Badge>
            ))}
          </div>
        </div>
      )}
      {row.sample_routes?.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample routes</h4>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface/60 uppercase text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">From</th><th className="px-3 py-2 text-left">To</th><th className="px-3 py-2 text-right">Fare from</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {row.sample_routes.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{r.from}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-1"><Plane className="size-3 text-amber-400" /> {r.to}</span></td>
                    <td className="px-3 py-2 text-right font-semibold text-highlight">{r.from_pkr ? formatPKR(r.from_pkr) : "Inquire"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
