import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Zap,
  Activity,
  DollarSign,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Sliders,
  Play,
  Save,
  Loader2,
  Layers,
  TrendingUp,
  BarChart3,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getAIConfigServer,
  saveAIConfigServer,
  getAIAnalyticsServer,
  verifyAIModelServer,
  type ModelVerificationResult,
} from "@/lib/ai-admin.functions";

function formatEventTimestamp(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  const monthDayStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${monthDayStr}, ${timeStr}`;
}

export const Route = createFileRoute("/_authenticated/admin/ai")({
  head: () => ({
    meta: [
      { title: "AI Control & Token Analytics · Admin Console" },
      { name: "description", content: "Monitor daily, weekly, monthly AI token consumption, costs, and manage active models." },
    ],
  }),
  component: AdminAIPage,
});

const PRESET_MODELS = [
  { id: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini (Recommended - Fast & Reliable)", isFree: false },
  { id: "google/gemini-2.0-flash-001", label: "Google Gemini 2.0 Flash", isFree: false },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Meta Llama 3.3 70B Instruct", isFree: false },
  { id: "anthropic/claude-3.5-haiku", label: "Anthropic Claude 3.5 Haiku", isFree: false },
];

function AdminAIPage() {
  const qc = useQueryClient();
  const getConfigFn = useServerFn(getAIConfigServer);
  const saveConfigFn = useServerFn(saveAIConfigServer);
  const getAnalyticsFn = useServerFn(getAIAnalyticsServer);
  const verifyModelFn = useServerFn(verifyAIModelServer);

  // Queries
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["admin-ai-config"],
    queryFn: () => getConfigFn(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-ai-analytics"],
    queryFn: () =>
      getAnalyticsFn({
        data: { timezoneOffset: new Date().getTimezoneOffset() },
      }),
    refetchInterval: 30000,
  });

  // Local Form & Chart State
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-4o-mini");
  const [customModel, setCustomModel] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(400);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<ModelVerificationResult | null>(null);

  // Recharts controls: timeframe tab & metric mode
  const [chartTimeframe, setChartTimeframe] = useState<"today" | "7d" | "30d">("7d");
  const [chartMetric, setChartMetric] = useState<"tokens" | "cost">("tokens");

  // Get active chart data series
  const activeChartData =
    chartTimeframe === "today"
      ? analytics?.time_series?.today ?? []
      : chartTimeframe === "30d"
      ? analytics?.time_series?.days_30 ?? []
      : analytics?.time_series?.days_7 ?? [];

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      const modelToSave = selectedModel === "custom" ? customModel.trim() : selectedModel;
      if (!modelToSave) throw new Error("Please select or enter an AI model ID.");
      return saveConfigFn({
        data: {
          active_model: modelToSave,
          max_tokens: maxTokens,
          custom_api_key: apiKeyInput.trim() || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("AI Configuration saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-ai-config"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save configuration");
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const modelToTest = selectedModel === "custom" ? customModel.trim() : selectedModel;
      if (!modelToTest) throw new Error("Please select or enter a model to verify.");
      return verifyModelFn({
        data: {
          model_id: modelToTest,
          custom_api_key: apiKeyInput.trim() || undefined,
        },
      });
    },
    onSuccess: (res) => {
      setVerificationResult(res);
      if (res.success) {
        toast.success(`Model verified! (${res.is_free ? "FREE Model" : "PAID Model"} · ${res.latency_ms}ms)`);
      } else {
        toast.error(res.error || "Model verification test failed");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Verification request failed");
    },
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
            <Sparkles className="size-3.5" /> AI ENGINE OPERATIONAL DASHBOARD
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            AI Control &amp; Token Analytics Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Track daily, weekly, monthly token usage and costs incurred, switch OpenRouter models, and verify model health.
          </p>
        </div>

        <Button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 px-5 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Verifying Model...
            </>
          ) : (
            <>
              <Play className="mr-2 size-4 fill-current" /> Verify &amp; Test Active Model
            </>
          )}
        </Button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Daily Metric */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Daily Usage (24h)
            </span>
            <div className="size-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight font-mono text-foreground">
              {analyticsLoading ? "..." : (analytics?.daily_tokens ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Tokens</span> · <span className="font-semibold text-sky-400">${analytics?.daily_cost_usd} USD</span>
              <span className="text-foreground/70">(₨ {analytics?.daily_cost_pkr})</span>
            </div>
          </div>
        </div>

        {/* Weekly Metric */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Weekly Usage (7d)
            </span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Activity className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight font-mono text-foreground">
              {analyticsLoading ? "..." : (analytics?.weekly_tokens ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Tokens</span> · <span className="font-semibold text-indigo-400">${analytics?.weekly_cost_usd} USD</span>
              <span className="text-foreground/70">(₨ {analytics?.weekly_cost_pkr})</span>
            </div>
          </div>
        </div>

        {/* Monthly Metric */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Usage (30d)
            </span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight font-mono text-foreground">
              {analyticsLoading ? "..." : (analytics?.monthly_tokens ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Tokens</span> · <span className="font-semibold text-purple-400">${analytics?.monthly_cost_usd} USD</span>
              <span className="text-foreground/70">(₨ {analytics?.monthly_cost_pkr})</span>
            </div>
          </div>
        </div>

        {/* Active Model Status */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Model
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cpu className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold truncate text-foreground" title={config?.active_model}>
              {configLoading ? "Loading..." : config?.active_model || "openai/gpt-4o-mini"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px]">
                <CheckCircle2 className="mr-1 size-3" /> Operational
              </Badge>
              {config?.active_model?.endsWith(":free") && (
                <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px]">
                  100% FREE
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Usage & Cost Trend Graph */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Interactive Usage &amp; Cost Progression Trend</h2>
              <p className="text-xs text-muted-foreground">Visualize token consumption and financial cost trajectory over time.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Toggle */}
            <div className="flex rounded-xl bg-surface p-1 border border-border text-xs">
              <button
                type="button"
                onClick={() => setChartMetric("tokens")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${chartMetric === "tokens" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <BarChart3 className="size-3.5 inline mr-1" /> Tokens View
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("cost")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${chartMetric === "cost" ? "bg-sky-500 text-slate-950 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Coins className="size-3.5 inline mr-1" /> Cost View (PKR)
              </button>
            </div>

            {/* Timeframe Tab Controls */}
            <div className="flex rounded-xl bg-surface p-1 border border-border text-xs">
              <button
                type="button"
                onClick={() => setChartTimeframe("today")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${chartTimeframe === "today" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Today (Hourly)
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe("7d")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${chartTimeframe === "7d" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe("30d")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${chartTimeframe === "30d" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Recharts AreaChart Container */}
        <div className="h-72 w-full pt-2">
          {analyticsLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin inline" /> Loading trend data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-slate-950/90 p-3 shadow-xl text-xs space-y-1 backdrop-blur-md">
                          <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1">{label}</p>
                          <p className="text-emerald-400 font-mono font-semibold">
                            Tokens: {data.tokens?.toLocaleString()}
                          </p>
                          <p className="text-sky-400 font-mono">
                            Cost: ${data.cost_usd} USD (₨ {data.cost_pkr} PKR)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {chartMetric === "tokens" ? (
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    name="Tokens Consumed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tokenGradient)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="cost_pkr"
                    name="Cost (PKR)"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#costGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model Configuration & Verification Control Box */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Dynamic Model &amp; API Key Configuration</h2>
              <p className="text-xs text-muted-foreground">Select AI provider models, configure API keys, and test live response latency.</p>
            </div>
          </div>

          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-mono">
            Provider: OpenRouter API
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Selection Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="model-select" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Select Active AI Model</span>
              <span className="text-[10px] text-muted-foreground font-normal">Stored in database settings</span>
            </Label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PRESET_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value="custom">-- Custom Model ID --</option>
            </select>

            {selectedModel === "custom" && (
              <Input
                type="text"
                placeholder="e.g. mistralai/mistral-7b-instruct:free"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="mt-2 text-xs bg-surface border-border"
              />
            )}
          </div>

          {/* Max Tokens Limit */}
          <div className="space-y-2">
            <Label htmlFor="max-tokens" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Max Output Tokens Cap</span>
              <span className="text-[10px] text-emerald-400 font-bold">Default: 400</span>
            </Label>
            <Input
              id="max-tokens"
              type="number"
              min={50}
              max={4000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 400)}
              className="h-10 text-xs bg-surface border-border font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Limits token generation per request to prevent OpenRouter credit quota errors.
            </p>
          </div>

          {/* OpenRouter API Key Override */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="api-key" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="size-3.5 text-primary" /> OpenRouter API Key Override
              </span>
              <span className="text-[10px] text-muted-foreground">
                Current: <code className="font-mono text-primary">{config?.masked_api_key}</code>
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-or-v1-... (leave empty to use default environment key)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="text-xs bg-surface border-border font-mono h-10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
                className="h-10 text-xs border-border text-muted-foreground hover:text-foreground shrink-0"
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Verification Results Card */}
        {verificationResult && (
          <div className={`p-4 rounded-2xl border ${verificationResult.success ? "border-emerald-500/30 bg-emerald-950/20" : "border-destructive/30 bg-destructive/10"} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {verificationResult.success ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="mr-1 size-3.5" /> Model Verified &amp; Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 bg-destructive/15 text-destructive text-xs font-bold">
                    <AlertCircle className="mr-1 size-3.5" /> Verification Failed
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className={`text-xs ${
                    verificationResult.is_free
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 font-extrabold"
                      : "border-amber-500/40 bg-amber-500/15 text-amber-300 font-bold"
                  }`}
                >
                  {verificationResult.is_free
                    ? "100% FREE MODEL ($0 / 1M Tokens)"
                    : "STANDARD MODEL"}
                </Badge>
              </div>

              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 text-primary" /> {verificationResult.latency_ms}ms latency
              </span>
            </div>

            {verificationResult.sample_output && (
              <div className="text-xs bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-slate-300">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  Live Test Completion Output:
                </span>
                "{verificationResult.sample_output}"
              </div>
            )}

            {verificationResult.error && (
              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-mono">
                {verificationResult.error}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="border-border text-xs h-10 px-4"
          >
            {testMutation.isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />} Test Health
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-primary text-primary-foreground font-bold text-xs h-10 px-6 shadow-md"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" /> Save AI Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feature Breakdown & Event Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Token Share */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="size-4 text-primary" />
            <h3 className="text-sm font-bold">Usage Share by Feature</h3>
          </div>

          <div className="space-y-4 pt-1">
            {analytics?.feature_breakdown.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {item.tokens.toLocaleString()} tokens ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h3 className="text-sm font-bold">Recent AI Invocation Audit Logs</h3>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Auto-refreshes 30s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                  <th className="py-2 px-2 font-bold">Timestamp</th>
                  <th className="py-2 px-2 font-bold">Feature</th>
                  <th className="py-2 px-2 font-bold">Model</th>
                  <th className="py-2 px-2 font-bold text-right">Tokens</th>
                  <th className="py-2 px-2 font-bold text-right">Cost (USD)</th>
                  <th className="py-2 px-2 font-bold text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {analytics?.recent_logs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-surface/50 transition">
                    <td className="py-2.5 px-2 font-mono text-muted-foreground whitespace-nowrap">
                      {formatEventTimestamp(log.created_at)}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-foreground">{log.feature}</td>
                    <td className="py-2.5 px-2 font-mono text-muted-foreground text-[11px] truncate max-w-[140px]">
                      {log.model}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-right text-emerald-400">
                      {log.total_tokens}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-right text-sky-400">
                      ${log.estimated_cost_usd}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-right text-muted-foreground">
                      {log.latency_ms}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
