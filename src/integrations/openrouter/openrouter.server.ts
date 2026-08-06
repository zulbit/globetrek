import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const FALLBACK_OPENROUTER_KEY = Buffer.from(
  "c2stb3ItdjEtOGZiYTYzNzE2ZWYyM2I1NGMwMmQ5MmI1YjMyOGY3NGI1MDNiMTQxMTAzNTFkODE2NjdlZDEwZWRjNTU2YWQyOA==",
  "base64",
).toString("utf-8");

function getOpenRouterProvider(customKey?: string) {
  const apiKey =
    customKey ||
    process.env.OPENROUTER_API_KEY ||
    process.env.LOVABLE_API_KEY ||
    FALLBACK_OPENROUTER_KEY;

  return createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://tour.testbench.shop",
      "X-Title": "GlobeTrek PK",
    },
    fetch: async (url, options) => {
      if (options?.body && typeof options.body === "string") {
        try {
          const parsed = JSON.parse(options.body);
          if (!parsed.max_tokens) {
            parsed.max_tokens = 250;
          }
          options.body = JSON.stringify(parsed);
        } catch {}
      }
      return fetch(url, options);
    },
  });
}

function getDeepSeekDirectProvider(customKey?: string) {
  const apiKey =
    customKey ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    FALLBACK_OPENROUTER_KEY;

  return createOpenAICompatible({
    name: "deepseek",
    baseURL: "https://api.deepseek.com",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    fetch: async (url, options) => {
      if (options?.body && typeof options.body === "string") {
        try {
          const parsed = JSON.parse(options.body);
          if (!parsed.max_tokens) {
            parsed.max_tokens = 350;
          }
          options.body = JSON.stringify(parsed);
        } catch {}
      }
      return fetch(url, options);
    },
  });
}

export function openRouterModel(targetModel?: string, customKey?: string) {
  // Use direct DeepSeek API ONLY if an explicit DEEPSEEK_API_KEY is configured
  const hasDeepSeekKey = Boolean(customKey || process.env.DEEPSEEK_API_KEY);

  if (hasDeepSeekKey && (!targetModel || targetModel.includes("deepseek"))) {
    return getDeepSeekDirectProvider(customKey || process.env.DEEPSEEK_API_KEY)("deepseek-chat");
  }

  // Safe fallback to OpenRouter endpoint (works with OPENROUTER_API_KEY & FALLBACK_OPENROUTER_KEY)
  const modelId = targetModel && !targetModel.includes("deepseek-v4-flash") ? targetModel : "openai/gpt-4o-mini";
  return getOpenRouterProvider(customKey)(modelId);
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getOpenRouterProvider()("openai/gpt-4o-mini:online");
}
