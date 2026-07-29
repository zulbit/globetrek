import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutTemplate, Sparkles, Save, Loader2, Grid3X3, Grid2X2, Sliders, Layers, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLandingCMSSettings, saveLandingCMSSettings, type LandingCMSSettings } from "@/lib/cms.functions";

export const Route = createFileRoute("/_authenticated/admin/landing-cms")({
  component: AdminLandingCMSPage,
});

function AdminLandingCMSPage() {
  const qc = useQueryClient();
  const getSettingsFn = useServerFn(getLandingCMSSettings);
  const saveSettingsFn = useServerFn(saveLandingCMSSettings);

  const { data: initialSettings, isLoading } = useQuery({
    queryKey: ["landing-cms-settings"],
    queryFn: () => getSettingsFn(),
  });

  const [settings, setSettings] = useState<LandingCMSSettings>({
    featured_tours_limit: 8,
    featured_tours_layout: "grid_4",
    featured_tours_heading: "Trending international departures",
    featured_tours_subheading: "Hand-picked experiences from verified Pakistani travel vendors — priced in PKR.",
    hero_title: "Compare & Book Travel Packages Across Pakistan",
    hero_subtitle: "Verified Pakistani travel operators, visa desks, and insurance providers in one transparent marketplace.",
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const saveMutation = useMutation({
    mutationFn: (newSettings: LandingCMSSettings) => saveSettingsFn({ data: newSettings }),
    onSuccess: () => {
      toast.success("Landing Page CMS updated live!", {
        description: "Featured tours capacity and homepage layout settings saved.",
      });
      qc.invalidateQueries({ queryKey: ["landing-cms-settings"] });
      qc.invalidateQueries({ queryKey: ["featured-tours"] });
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <LayoutTemplate className="size-4" /> Homepage Content &amp; Capacity Control
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Landing Page CMS</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Control Featured Tours capacity limits, grid or carousel layout modes, and homepage hero announcements live.
          </p>
        </div>
        <Button
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(settings)}
          className="font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 gap-1.5 shadow-md"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Saving CMS…</>
          ) : (
            <><Save className="size-4" /> Save CMS Changes</>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Featured Tours Capacity & Layout Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Capacity & Layout Controls */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
            <div className="border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                <Sliders className="size-4" /> Featured Tours Capacity
              </div>
              <h3 className="text-base font-bold text-foreground">Card Quantity &amp; Grid Density</h3>
              <p className="text-xs text-muted-foreground">
                Select how many packages to display and whether to show a 4-column grid, 3-column grid, or horizontal swipeable carousel slider.
              </p>
            </div>

            {/* Capacity Limit Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Number of Featured Packages Allowed
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { count: 4, label: "4 Cards", sub: "1 Row of 4" },
                  { count: 8, label: "8 Cards", sub: "2 Rows of 4" },
                  { count: 12, label: "12 Cards", sub: "3 Rows of 4" },
                  { count: 16, label: "16 Cards", sub: "4 Rows of 4" },
                ].map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, featured_tours_limit: opt.count }))}
                    className={`rounded-xl border p-3 text-left transition ${
                      settings.featured_tours_limit === opt.count
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 shadow-xs"
                        : "border-border bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <div className="font-bold text-sm text-foreground">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Mode Selector */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-xs font-bold text-foreground block">
                Homepage Featured Layout Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "grid_4",
                    name: "4 Cards / Row",
                    desc: "Desktop 4-column responsive grid",
                    icon: Grid2X2,
                  },
                  {
                    id: "grid_3",
                    name: "3 Cards / Row",
                    desc: "Desktop 3-column expanded grid",
                    icon: Grid3X3,
                  },
                  {
                    id: "carousel",
                    name: "Swipe Carousel",
                    desc: "Swipeable horizontal slider",
                    icon: Layers,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const selected = settings.featured_tours_layout === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, featured_tours_layout: mode.id as any }))}
                      className={`rounded-xl border p-3.5 text-left transition relative flex flex-col justify-between ${
                        selected
                          ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 shadow-xs"
                          : "border-border bg-surface/40 text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          {selected && <CheckCircle2 className="size-3.5 text-primary" />}
                        </div>
                        <div className="font-bold text-xs text-foreground">{mode.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{mode.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Headings */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Section Main Title
                </label>
                <Input
                  value={settings.featured_tours_heading}
                  onChange={(e) => setSettings((s) => ({ ...s, featured_tours_heading: e.target.value }))}
                  placeholder="Trending international departures"
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Section Subheading / Tagline
                </label>
                <Textarea
                  rows={2}
                  value={settings.featured_tours_subheading}
                  onChange={(e) => setSettings((s) => ({ ...s, featured_tours_subheading: e.target.value }))}
                  placeholder="Hand-picked experiences from verified Pakistani travel vendors — priced in PKR."
                  className="text-xs rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Section & Live Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 2: Hero Section Text */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Sparkles className="size-4" /> Homepage Hero Banner
              </div>
              <h3 className="text-base font-bold text-foreground">Main Value Proposition</h3>
              <p className="text-xs text-muted-foreground">
                Customize the primary headline and subtitle rendered on the main landing hero section.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Main Hero Title
                </label>
                <Input
                  value={settings.hero_title}
                  onChange={(e) => setSettings((s) => ({ ...s, hero_title: e.target.value }))}
                  placeholder="Compare & Book Travel Packages Across Pakistan"
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Hero Subtitle Description
                </label>
                <Textarea
                  rows={3}
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings((s) => ({ ...s, hero_subtitle: e.target.value }))}
                  placeholder="Verified Pakistani travel operators..."
                  className="text-xs rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Live Configuration Summary Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-primary">
              <HelpCircle className="size-4" /> CMS Status Summary
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Featured Capacity:</span>
                <span className="font-mono font-bold text-foreground">{settings.featured_tours_limit} Packages</span>
              </div>
              <div className="flex justify-between">
                <span>Layout Mode:</span>
                <span className="font-mono font-bold text-primary capitalize">
                  {settings.featured_tours_layout === "grid_4"
                    ? "4 Columns Grid"
                    : settings.featured_tours_layout === "grid_3"
                      ? "3 Columns Grid"
                      : "Swipe Carousel"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Storage Target:</span>
                <span className="font-mono font-bold text-foreground">payment_gateway_settings</span>
              </div>
            </div>

            <Button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(settings)}
              className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-2"
            >
              {saveMutation.isPending ? "Applying Changes..." : "Publish Live to Homepage"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
