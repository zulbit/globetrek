import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, HelpCircle, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getSubscriptionPlans, saveSubscriptionPlans } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: AdminSubscriptions,
});

// Fallback matching TIERS structure but serializable
const DEFAULT_PLANS = [
  {
    id: "free",
    name: "Free",
    price_pkr: 0,
    tagline: "Trial account",
    archetype: "Trying the marketplace",
    iconName: "Sparkles",
    accent: "muted-foreground",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "3 active listings — any category",
      "5 lead credits / month",
      "Basic public profile",
      "Community support",
    ],
    limits: {
      listings: "3 total",
      services: "Any 1 category",
      leadCredits: "5 / month",
      aiDrafts: "—",
      aiPlans: "—",
      placement: "Standard",
      support: "Community",
    },
  },
  {
    id: "starter",
    name: "Travel Desk",
    price_pkr: 4000,
    tagline: "Visa · Insurance · Tickets",
    archetype: "Ticketing desks, visa agents & insurance specialists",
    iconName: "Zap",
    accent: "sky-400",
    covers: ["visa", "insurance", "tickets"],
    features: [
      "Up to 30 active service listings",
      "60 lead credits / month",
      "Visa · Insurance · Tickets categories",
      "10 AI listing descriptions / month",
      "Email support (48h)",
    ],
    limits: {
      listings: "30 total",
      services: "Visa · Insurance · Tickets",
      leadCredits: "60 / month",
      aiDrafts: "10 / month",
      aiPlans: "—",
      placement: "Standard",
      support: "Email · 48h",
    },
  },
  {
    id: "pro",
    name: "Tour Operator",
    price_pkr: 7500,
    tagline: "Tour packages + AI planner",
    archetype: "Tour operators building international packages",
    iconName: "Crown",
    accent: "primary",
    covers: ["tours"],
    features: [
      "Unlimited tour listings",
      "100 lead credits / month",
      "Unlimited AI descriptions",
      "50 AI full-trip plans / month",
      "Priority placement in search",
      "Verified vendor badge",
      "Priority email support (12h)",
    ],
    limits: {
      listings: "Unlimited",
      services: "Tours only",
      leadCredits: "100 / month",
      aiDrafts: "Unlimited",
      aiPlans: "50 / month",
      placement: "Priority",
      support: "Priority · 12h",
    },
  },
  {
    id: "agency",
    name: "Full Agency",
    price_pkr: 12000,
    tagline: "Everything, unified",
    archetype: "Full-service agencies selling tours + visa + insurance + tickets",
    iconName: "Rocket",
    accent: "amber-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "Unlimited listings across all 4 categories",
      "300 lead credits / month",
      "Unlimited AI plans & descriptions",
      "Featured homepage placement",
      "Multi-seat team + dedicated account manager",
      "API + CSV bulk operations",
    ],
    limits: {
      listings: "Unlimited + team",
      services: "Tours · Visa · Insurance · Tickets",
      leadCredits: "300 / month",
      aiDrafts: "Unlimited",
      aiPlans: "Unlimited",
      placement: "Featured",
      support: "Dedicated AM",
    },
  },
];

function AdminSubscriptions() {
  const qc = useQueryClient();
  const getPlansFn = useServerFn(getSubscriptionPlans);
  const savePlansFn = useServerFn(saveSubscriptionPlans);

  const { data: dbPlans, isLoading } = useQuery({
    queryKey: ["admin-subscription-plans-config"],
    queryFn: () => getPlansFn(),
  });

  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);

  useEffect(() => {
    if (dbPlans && dbPlans.length > 0) {
      setPlans(dbPlans);
    }
  }, [dbPlans]);

  const saveMutation = useMutation({
    mutationFn: (next: any[]) => savePlansFn({ data: next }),
    onSuccess: () => {
      toast.success("Subscription plans updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePriceChange = (id: string, val: number) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, price_pkr: val } : p)));
  };

  const handleTextFieldChange = (id: string, field: string, val: string) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const handleLimitChange = (id: string, key: string, val: string) => {
    setPlans(
      plans.map((p) =>
        p.id === id ? { ...p, limits: { ...p.limits, [key]: val } } : p
      )
    );
  };

  const handleFeaturesChange = (id: string, featuresStr: string) => {
    const list = featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    setPlans(plans.map((p) => (p.id === id ? { ...p, features: list } : p)));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscription Package Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure dynamic pricing plans, features, and platform limits displayed to vendors on the pricing page.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(plans)}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-4" />
          )}
          Save Pricing Configurations
        </Button>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading configurations…</span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-primary tracking-wider">{p.id} Tier</span>
                  <h2 className="text-lg font-bold text-foreground">{p.name} Package</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Price (PKR):</span>
                  <Input
                    type="number"
                    value={p.price_pkr}
                    onChange={(e) => handlePriceChange(p.id, Number(e.target.value))}
                    className="h-8 w-28 font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tagline</label>
                  <Input
                    value={p.tagline}
                    onChange={(e) => handleTextFieldChange(p.id, "tagline", e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Tour packages + AI planner"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Archetype Description</label>
                  <Input
                    value={p.archetype}
                    onChange={(e) => handleTextFieldChange(p.id, "archetype", e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Tour operators building packages"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Features List (One feature per line)
                </label>
                <Textarea
                  value={p.features.join("\n")}
                  onChange={(e) => handleFeaturesChange(p.id, e.target.value)}
                  className="mt-1 font-sans text-xs min-h-[100px]"
                  placeholder="Feature 1&#10;Feature 2"
                />
              </div>

              <div className="border-t border-border/60 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Limits & Specs</h3>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Active listings limit:</span>
                    <Input
                      value={p.limits.listings}
                      onChange={(e) => handleLimitChange(p.id, "listings", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Service categories:</span>
                    <Input
                      value={p.limits.services}
                      onChange={(e) => handleLimitChange(p.id, "services", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Monthly Lead Credits:</span>
                    <Input
                      value={p.limits.leadCredits}
                      onChange={(e) => handleLimitChange(p.id, "leadCredits", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">AI listing descriptions:</span>
                    <Input
                      value={p.limits.aiDrafts}
                      onChange={(e) => handleLimitChange(p.id, "aiDrafts", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">AI full-trip planner:</span>
                    <Input
                      value={p.limits.aiPlans}
                      onChange={(e) => handleLimitChange(p.id, "aiPlans", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Search placement priority:</span>
                    <Input
                      value={p.limits.placement}
                      onChange={(e) => handleLimitChange(p.id, "placement", e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
