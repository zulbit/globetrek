# 🧠 GlobeTrek PK — AI Architecture & Multi-Tier Fallback Design

---

## 📌 Executive Summary

GlobeTrek PK utilizes a hybrid multi-model AI infrastructure engineered for:
1. **Sub-second Response Times** (< 500ms for concierge inquiries).
2. **Cost Efficiency & High Throughput** via QwenCloud / DashScope free quota (1M tokens per model).
3. **High-Converting Conversational Sales UX** using the **3-Part Conversational Sandwich** framework.
4. **Zero-Downtime Reliability** with a **3-Layer Cascading Self-Healing Fallback system**.

---

## 🏗️ 1. AI Feature-to-Model Matrix

| AI Feature | Primary Engine / Provider | Endpoint / Protocol | Purpose & Latency Target |
| :--- | :--- | :--- | :--- |
| **💬 AI Travel Concierge** | `qwen-turbo` / `qwen-plus` | DashScope Compatible API | Real-time multilingual travel sales advisor (< 800ms). |
| **🌴 Day-by-Day Tour Generator** | `qwen-turbo` / `qwen3.8-max` | DashScope Compatible API | Structured JSON day-by-day itineraries and time-slotted activities. |
| **✍️ Tour Marketing Copy** | `qwen-turbo` | DashScope Compatible API | Punchy 60-word sales descriptions for package cards. |
| **🌐 Live Embassy Visa Lookup** | `openai/gpt-4o-mini:online` | OpenRouter Web Grounding | Real-time web-search grounded embassy rules and fee verification. |

---

## 🔀 2. Dynamic Provider Routing

The AI routing layer in `src/integrations/openrouter/openrouter.server.ts` automatically dispatches requests to the optimal endpoint:

```ts
export function openRouterModel(targetModel?: string, customKey?: string) {
  const modelId = targetModel || "qwen-turbo";

  // 1. QwenCloud / DashScope Routing (sk-ws-... or qwen/deepseek-v4/glm)
  if (customKey?.startsWith("sk-ws-") || modelId.startsWith("qwen") || modelId.startsWith("deepseek-v4")) {
    return getDashScopeProvider(customKey)(modelId);
  }

  // 2. DeepSeek Direct API Routing
  if (modelId.includes("deepseek") && !modelId.startsWith("deepseek-v4")) {
    return getDeepSeekDirectProvider(customKey)("deepseek-chat");
  }

  // 3. OpenRouter Universal Fallback
  return getOpenRouterProvider(customKey)(modelId);
}
```

---

## 🥪 3. The 3-Part Conversational Sandwich Framework

All customer-facing AI responses strictly enforce the **Conversational Sandwich** rules:

```
┌───────────────────────────────────────────────────────────┐
│ Part 1: Warm Hook & Excitement                            │
│ "Awesome choice! Dubai is one of our top destinations! 🌆"│
├───────────────────────────────────────────────────────────┤
│ Part 2: Structured Package Summary                        │
│ • Title: 5 Days Tour to UAE (Dubai)                       │
│ • Departure: Islamabad                                    │
│ • Price: ₨ 250,000 per person                             │
│ • Dates: 14 Sept 2026 (Booking Deadline: 01 Sept 2026)     │
│ • Highlights: Burj Khalifa, Desert Safari, Marina Cruise  │
├───────────────────────────────────────────────────────────┤
│ Part 3: Mandatory Engagement Question & Dynamic Chips     │
│ "Is this date suitable, or would you like a custom group  │
│  itinerary?"                                              │
│ [[choose: 💳 Reserve Slots | 📄 Visa Info | 🌴 Custom Trip]]│
└───────────────────────────────────────────────────────────┘
```

---

## 🛡️ 4. Multi-Tier Cascading Fallback System

If an AI provider fails, encounters a rate limit (HTTP 429), or exceeds latency bounds, the system automatically falls through a 3-layer safety net:

```mermaid
flowchart TD
    A[Customer Chat / Vendor Request] --> B[Layer 1: Primary Model e.g. Qwen-Turbo]
    B -->|Success < 4.5s| G[Deliver Response]
    B -->|HTTP 429 / 402 / 500 Error| C[Layer 2: AI Provider Auto-Retry]
    C -->|Fallback to secondary free router| G
    B -->|Network Stall > 4.5s Timeout| D[Layer 3: Smart Grounded Fallback]
    C -->|Both AI APIs fail| D
    D --> E[Query Live Supabase Catalog (Tours, Visas, Insurance)]
    E --> F[Generate Grounded Conversational Sandwich & Action Chips]
    F --> G
```

### 🔹 Layer 1: Provider-Level Auto-Retry (`generateTextWithFallback`)
* **File:** `src/integrations/openrouter/openrouter.server.ts`
* Catches API exceptions (billing, invalid key, rate limits) and automatically retries using a secondary free backup model (`openrouter/free`).

### 🔹 Layer 2: 4.5-Second Bounded Race Timeout
* **File:** `src/routes/api/ai-chat.ts`
* Runs `Promise.race([aiPromise, timeoutPromise])` capped at 4,500ms.
* Prevents chat widgets from hanging on queued third-party API servers.

### 🔹 Layer 3: Zero-Downtime Grounded Catalog Fallback
* **File:** `src/routes/api/ai-chat.ts`
* Pre-queries Supabase for verified tour packages, visa desks, insurance plans, and flight desks.
* Formats listings with accurate **₨ [Price]**, human dates, and contextual action chips.
* Guarantees travelers **never encounter a raw error or blank message**.

---

## 📊 5. Real-Time Telemetry & Invocation Auditing

Every AI request writes structured telemetry directly to Supabase (`payment_gateway_settings` under `ai_invocation_logs`):

```json
{
  "id": "inv-1786547045925-gmon",
  "model": "qwen-turbo",
  "feature": "AI Concierge Chat",
  "prompt_tokens": 1529,
  "completion_tokens": 165,
  "total_tokens": 1694,
  "estimated_cost_usd": 0,
  "latency_ms": 1583,
  "status": "success",
  "created_at": "2026-08-12T15:04:05.925Z"
}
```

* **Token Precision:** Reads exact `promptTokens` and `completionTokens` directly from provider API response headers.
* **Latency Telemetry:** Tracks true end-to-end network + inference time.
* **Admin Dashboard:** Real-time auto-refreshing table accessible at [`/admin/ai`](https://globetrek.pk/admin/ai).

---

## ⚙️ 6. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DASHSCOPE_API_KEY` | QwenCloud / DashScope API key | `sk-ws-H.DMLEIXY...` |
| `OPENROUTER_API_KEY` | OpenRouter secondary key | `sk-or-v1-...` |
| `DEEPSEEK_API_KEY` | Direct DeepSeek platform key | `sk-63b81cc...` |
