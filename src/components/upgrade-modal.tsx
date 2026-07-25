import { Link } from "@tanstack/react-router";
import { Check, Sparkles, X, ArrowRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TIERS, formatTierPrice } from "@/lib/pricing";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Feature that triggered the upgrade (shown in the header). */
  feature?: string;
  /** Which tier to visually recommend. */
  recommend?: "starter" | "pro" | "agency";
};

export function UpgradeModal({ open, onOpenChange, feature, recommend = "pro" }: Props) {
  const shown = TIERS.filter((t) => t.id !== "free");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-border bg-card p-0">
        <div className="relative border-b border-border bg-linear-to-br from-primary/10 via-highlight/5 to-transparent p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <Sparkles className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg">
                  {feature ? `Unlock ${feature}` : "Upgrade your vendor plan"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Plans are shaped around real vendor archetypes — pick the one that
                  matches how you sell travel. Switch anytime.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-3 p-6 md:grid-cols-3">
          {shown.map((tier) => {
            const isRec = tier.id === recommend;
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-xl border p-4 transition-colors ${
                  isRec
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-surface/50"
                }`}
              >
                {isRec && (
                  <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Recommended
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`size-4 ${isRec ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="text-sm font-semibold">{tier.name}</h3>
                </div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">
                    {formatTierPrice(tier.price_pkr)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{tier.tagline}</p>

                <ul className="mb-4 space-y-1.5 text-xs">
                  {tier.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="sm"
                  className={`mt-auto w-full ${
                    isRec
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-surface-2 text-foreground hover:bg-surface"
                  }`}
                >
                  <Link to="/vendor/billing" onClick={() => onOpenChange(false)}>
                    Choose {tier.name}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface/40 px-6 py-3">
          <Link
            to="/pricing"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Compare all features <ArrowRight className="size-3" />
          </Link>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" /> Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
