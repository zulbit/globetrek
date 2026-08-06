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
  });
}

/** Fast + powerful AI model — concierge chat, tour itineraries, fee lookup */
export function openRouterModel(targetModel?: string, customKey?: string) {
  const modelId = targetModel || "deepseek-v4-flash";

  if (modelId === "deepseek-v4-flash" || modelId === "deepseek-chat") {
    return getDeepSeekDirectProvider(customKey)("deepseek-chat");
  }

  return getOpenRouterProvider(customKey)(modelId);
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getOpenRouterProvider()("openai/gpt-4o-mini:online");
}
