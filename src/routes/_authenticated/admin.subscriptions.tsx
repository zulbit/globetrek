import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, HelpCircle, AlertCircle, Sparkles, CheckCircle2, SwitchCamera, ToggleLeft, ToggleRight, Search, Bot, Globe2, MegaPhone } from "lucide-react";
import { toast } from "sonner";
import { getSubscriptionPlans, saveSubscriptionPlans, togglePlanEnabled } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: AdminSubscriptions,
});

const DEFAULT_PLANS = [
  {
    id: "free",
    name: "Free Trial",
    plan_type: "base",
    price_pkr: 0,
    billing_period: "monthly",
    tagline: "Trial account",
    archetype: "Trying the marketplace",
    icon_name: "Sparkles",
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
    is_enabled: true,
    display_order: 1,
  },
  {
    id: "starter",
    name: "Travel Desk",
    plan_type: "base",
    price_pkr: 4000,
    billing_period: "monthly",
    tagline: "Visa · Insurance · Tickets",
    archetype: "Ticketing desks, visa agents & insurance specialists",
    icon_name: "Zap",
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
    is_enabled: true,
    display_order: 2,
  },
  {
    id: "pro",
    name: "Tour Operator",
    plan_type: "base",
    price_pkr: 7500,
    billing_period: "monthly",
    tagline: "Tour packages + AI planner",
    archetype: "Tour operators building international packages",
    icon_name: "Crown",
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
    is_enabled: true,
    display_order: 3,
  },
  {
    id: "agency",
    name: "Full Agency",
    plan_type: "base",
    price_pkr: 12000,
    billing_period: "monthly",
    tagline: "Everything, unified",
    archetype: "Full-service agencies selling tours + visa + insurance + tickets",
    icon_name: "Rocket",
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
    is_enabled: true,
    display_order: 4,
  },
  {
    id: "placement_search",
    name: "Search Placement Boost",
    plan_type: "placement",
    price_pkr: 8000,
    billing_period: "monthly",
    tagline: "Top-of-search ranking",
    archetype: "Boost your packages to #1 position in search queries",
    icon_name: "Search",
    accent: "emerald-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "Top 3 search placement boost",
      "Featured badge on search results",
      "4x average click-through rate",
      "Priority customer lead routing",
    ],
    limits: {
      listings: "All listings",
      services: "Search Boost",
      leadCredits: "+50 / month",
      placement: "Top #1-#3 Search",
    },
    is_enabled: true,
    display_order: 5,
  },
  {
    id: "placement_ai",
    name: "AI Concierge Recommendation",
    plan_type: "placement",
    price_pkr: 12000,
    billing_period: "monthly",
    tagline: "AI Concierge Spotlight",
    archetype: "Get recommended by bilingual AI Concierge in Roman Urdu & English",
    icon_name: "Bot",
    accent: "purple-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "Direct AI recommendation priority in Roman Urdu & English",
      "AI Concierge booking link placement",
      "High-trust customer lead conversions",
      "Weekly AI recommendation stats",
    ],
    limits: {
      listings: "AI Recommended",
      services: "AI Chat Spotlight",
      leadCredits: "+100 / month",
      placement: "AI Concierge Priority",
    },
    is_enabled: true,
    display_order: 6,
  },
  {
    id: "placement_landing",
    name: "Landing Page Spotlight",
    plan_type: "placement",
    price_pkr: 15000,
    billing_period: "monthly",
    tagline: "Featured Agency Spotlight",
    archetype: "Spotlight your agency logo & packages on main landing page",
    icon_name: "Globe2",
    accent: "amber-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "Featured Agency Spotlight card on landing page",
      "Top hero slider package placement",
      "Maximum brand exposure & trust",
      "Dedicated profile showcase",
    ],
    limits: {
      listings: "Homepage Spotlight",
      services: "Landing Page",
      leadCredits: "+150 / month",
      placement: "Homepage Top Slider",
    },
    is_enabled: true,
    display_order: 7,
  },
  {
    id: "ad_flash_banner_1w",
    name: "1-Week Flash Hero Banner Ad",
    plan_type: "advertisement",
    price_pkr: 15000,
    billing_period: "weekly",
    tagline: "7-Day Promotional Banner",
    archetype: "High-impact 7-day flash campaign banner on landing page hero",
    icon_name: "Sparkles",
    accent: "rose-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "7-Day Exclusive Hero Banner Ad on Landing Page",
      "Custom call-to-action link to your package or store",
      "Ideal for seasonal sales (Umrah, Baku Winter, Eid Specials)",
      "Dedicated campaign analytics report",
    ],
    limits: {
      listings: "Hero Banner",
      services: "1-Week Ad",
      leadCredits: "+100 / campaign",
      placement: "7-Day Hero Banner",
    },
    is_enabled: true,
    display_order: 8,
  },
];

function AdminSubscriptions() {
  const qc = useQueryClient();
  const getPlansFn = useServerFn(getSubscriptionPlans);
  const savePlansFn = useServerFn(saveSubscriptionPlans);
  const toggleEnabledFn = useServerFn(togglePlanEnabled);

  const { data: dbPlans, isLoading } = useQuery({
    queryKey: ["admin-subscription-plans-config"],
    queryFn: () => getPlansFn({ data: { includeDisabled: true } }),
  });

  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [filterType, setFilterType] = useState<"all" | "base" | "placement" | "advertisement">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Plan Modal Form State
  const [newPlanId, setNewPlanId] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanType, setNewPlanType] = useState<"base" | "placement" | "advertisement">("placement");
  const [newPricePKR, setNewPricePKR] = useState(10000);
  const [newPeriod, setNewPeriod] = useState<"monthly" | "weekly" | "one_time">("monthly");
  const [newTagline, setNewTagline] = useState("");
  const [newFeaturesStr, setNewFeaturesStr] = useState("Feature 1\nFeature 2");

  useEffect(() => {
    if (dbPlans && dbPlans.length > 0) {
      setPlans(dbPlans);
    }
  }, [dbPlans]);

  const saveMutation = useMutation({
    mutationFn: (next: any[]) => savePlansFn({ data: next }),
    onSuccess: () => {
      toast.success("Subscription & advertisement plans saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ planId, isEnabled }: { planId: string; isEnabled: boolean }) =>
      toggleEnabledFn({ data: { planId, isEnabled } }),
    onSuccess: (_, variables) => {
      toast.success(`Plan ${variables.isEnabled ? "enabled" : "disabled"}!`);
      setPlans(plans.map((p) => (p.id === variables.planId ? { ...p, is_enabled: variables.isEnabled } : p)));
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      const id = newPlanId.toLowerCase().trim().replace(/\s+/g, "_") || `plan_${Date.now()}`;
      const newRecord = {
        id,
        name: newPlanName,
        plan_type: newPlanType,
        price_pkr: Number(newPricePKR),
        billing_period: newPeriod,
        tagline: newTagline,
        archetype: newTagline,
        icon_name: "Sparkles",
        accent: newPlanType === "advertisement" ? "rose-400" : newPlanType === "placement" ? "purple-400" : "primary",
        covers: ["tours", "visa", "insurance", "tickets"],
        features: newFeaturesStr.split("\n").map((s) => s.trim()).filter(Boolean),
        limits: { placement: newPlanName, services: newPlanType },
        is_enabled: true,
        display_order: plans.length + 1,
      };
      await savePlansFn({ data: newRecord });
      return newRecord;
    },
    onSuccess: (created) => {
      toast.success(`Created plan: ${created.name}`);
      setPlans([...plans, created]);
      setCreateModalOpen(false);
      setNewPlanName(""); setNewPlanId(""); setNewTagline("");
      qc.invalidateQueries({ queryKey: ["admin-subscription-plans-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTogglePlan = (id: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    toggleMutation.mutate({ planId: id, isEnabled: nextEnabled });
  };

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

  const filteredPlans = plans.filter((p) => filterType === "all" || p.plan_type === filterType);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Subscription Tiers &amp; Placement Ad Configurations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
            Manage base vendor subscriptions, Search/AI placement boosts, and 1-Week Hero Flash Banner Ads. Toggle plans enabled or disabled in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 font-semibold"
          >
            <Plus className="mr-1.5 size-4" /> Add Custom Plan / Ad
          </Button>

          <Button
            onClick={() => saveMutation.mutate(plans)}
            disabled={saveMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-4" />
            )}
            Save Configurations
          </Button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
        <Button
          size="sm"
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className="text-xs font-semibold rounded-xl"
        >
          All ({plans.length})
        </Button>
        <Button
          size="sm"
          variant={filterType === "base" ? "default" : "outline"}
          onClick={() => setFilterType("base")}
          className="text-xs font-semibold rounded-xl"
        >
          Base Plans ({plans.filter((p) => (p.plan_type || "base") === "base").length})
        </Button>
        <Button
          size="sm"
          variant={filterType === "placement" ? "default" : "outline"}
          onClick={() => setFilterType("placement")}
          className="text-xs font-semibold rounded-xl text-purple-400 border-purple-500/30"
        >
          Placement Addons ({plans.filter((p) => p.plan_type === "placement").length})
        </Button>
        <Button
          size="sm"
          variant={filterType === "advertisement" ? "default" : "outline"}
          onClick={() => setFilterType("advertisement")}
          className="text-xs font-semibold rounded-xl text-rose-400 border-rose-500/30"
        >
          Flash Banner Ad Addons ({plans.filter((p) => p.plan_type === "advertisement").length})
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading configurations…</span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredPlans.map((p) => {
            const isEnabled = p.is_enabled !== false;
            const isBase = (p.plan_type || "base") === "base";
            const isPlacement = p.plan_type === "placement";
            const isAd = p.plan_type === "advertisement";

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                  !isEnabled
                    ? "opacity-60 bg-muted/20 border-dashed border-border"
                    : isAd
                    ? "bg-card border-rose-500/30"
                    : isPlacement
                    ? "bg-card border-purple-500/30"
                    : "bg-card border-border"
                }`}
              >
                {/* Plan Header & Enable/Disable Toggle */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] uppercase font-extrabold ${
                          isAd
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : isPlacement
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-primary/20 text-primary border-primary/30"
                        }`}
                      >
                        {p.plan_type || "base"}
                      </Badge>
                      <h2 className="text-lg font-bold text-foreground">{p.name}</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">ID: {p.id}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Enable / Disable Switch */}
                    <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-1.5 border border-border">
                      <span className="text-xs font-semibold">
                        {isEnabled ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="size-3.5" /> Enabled
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="size-3.5" /> Disabled
                          </span>
                        )}
                      </span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleTogglePlan(p.id, isEnabled)}
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground font-semibold">PKR:</span>
                      <Input
                        type="number"
                        value={p.price_pkr}
                        onChange={(e) => handlePriceChange(p.id, Number(e.target.value))}
                        className="h-8 w-24 font-mono font-bold text-right text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Plan Metadata */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Tagline</label>
                    <Input
                      value={p.tagline || ""}
                      onChange={(e) => handleTextFieldChange(p.id, "tagline", e.target.value)}
                      className="mt-1 text-xs"
                      placeholder="e.g. Tour packages + AI planner"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Billing Period</label>
                    <Input
                      value={p.billing_period || "monthly"}
                      onChange={(e) => handleTextFieldChange(p.id, "billing_period", e.target.value)}
                      className="mt-1 text-xs font-mono"
                      placeholder="monthly / weekly / one_time"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Features List (One per line)
                  </label>
                  <Textarea
                    value={(p.features || []).join("\n")}
                    onChange={(e) => handleFeaturesChange(p.id, e.target.value)}
                    className="mt-1 font-sans text-xs min-h-[90px]"
                    placeholder="Feature 1&#10;Feature 2"
                  />
                </div>

                <div className="border-t border-border/60 pt-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Limits &amp; Specs</h3>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-muted-foreground font-semibold text-[11px]">Listings limit:</span>
                      <Input
                        value={p.limits?.listings || ""}
                        onChange={(e) => handleLimitChange(p.id, "listings", e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-muted-foreground font-semibold text-[11px]">Placement boost:</span>
                      <Input
                        value={p.limits?.placement || ""}
                        onChange={(e) => handleLimitChange(p.id, "placement", e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Vendor Addons & Multi-Vendor Rotation Capacity Section */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-0.5">
              <Sparkles className="size-4" /> Capacity &amp; Rotation Engine
            </div>
            <h3 className="text-base font-bold text-foreground">Active Vendor Add-on Subscriptions &amp; Slot Capacity</h3>
            <p className="text-xs text-muted-foreground">
              Track vendor add-on purchases, expiry dates, and automated multi-vendor banner/search placement rotation rules.
            </p>
          </div>
          <Badge className="bg-purple-500 text-white font-bold text-xs">
            Multi-Vendor Fair Rotation Active
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="font-bold text-foreground block">1-Week Flash Banner Slot Rule</span>
            <p className="text-muted-foreground leading-relaxed">
              If multiple vendors opt for Flash Hero Banners simultaneously (e.g. 3 vendors), the landing page hero algorithm auto-rotates banners on page refresh.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="font-bold text-foreground block">Search Placement Boost Rule</span>
            <p className="text-muted-foreground leading-relaxed">
              Vendors with active Search Boosts are prioritized in top #1-#3 positions across Category Search &amp; Universal RPC query results.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="font-bold text-foreground block">AI Concierge Spotlight Rule</span>
            <p className="text-muted-foreground leading-relaxed">
              Bilingual AI travel assistant prioritizes active AI Concierge Spotlight vendors when answering traveler itinerary queries.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Plan Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <span>＋ Create New Plan / Placement Addon</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new base subscription tier, search/AI placement boost, or 1-week flash banner advertisement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">Plan Category / Type*</label>
              <select
                value={newPlanType}
                onChange={(e: any) => setNewPlanType(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs"
              >
                <option value="base">Base Vendor Plan (Monthly)</option>
                <option value="placement">Placement Subscription Add-on (Search/AI/Landing)</option>
                <option value="advertisement">Advertisement Campaign (1-Week Flash Banner)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Plan Name*</label>
              <Input
                placeholder="e.g. 1-Week Ramadan Flash Banner Ad"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-semibold block mb-1">Price (PKR)*</label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newPricePKR}
                  onChange={(e) => setNewPricePKR(Number(e.target.value))}
                  className="font-mono text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Billing Period*</label>
                <select
                  value={newPeriod}
                  onChange={(e: any) => setNewPeriod(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly (7-Day)</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Tagline</label>
              <Input
                placeholder="e.g. 7-Day Exclusive Hero Banner on Landing Page"
                value={newTagline}
                onChange={(e) => setNewTagline(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Features (One per line)</label>
              <Textarea
                rows={3}
                value={newFeaturesStr}
                onChange={(e) => setNewFeaturesStr(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createPlanMutation.mutate()}
              disabled={createPlanMutation.isPending || !newPlanName}
              className="bg-primary text-primary-foreground font-bold gap-1.5 rounded-xl"
            >
              {createPlanMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create &amp; Publish Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
