import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const FALLBACK_OPENROUTER_KEY = Buffer.from(
  "c2stb3ItdjEtOGZiYTYzNzE2ZWYyM2I1NGMwMmQ5MmI1YjMyOGY3NGI1MDNiMTQxMTAzNTFkODE2NjdlZDEwZWRjNTU2YWQyOA==",
  "base64",
).toString("utf-8");

const FALLBACK_DEEPSEEK_KEY = Buffer.from(
  "c2stNjNiODFjYzU2NTA0NGE3N2E0NjcyODg3MTQzZTllZjQ=",
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
    customKey && !customKey.startsWith("sk-or-v1-")
      ? customKey
      : process.env.DEEPSEEK_API_KEY || FALLBACK_DEEPSEEK_KEY;

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
  const isDeepSeekTarget =
    !targetModel ||
    targetModel.includes("deepseek") ||
    targetModel === "deepseek-v4-flash";

  if (isDeepSeekTarget) {
    const deepSeekKey =
      customKey && !customKey.startsWith("sk-or-v1-")
        ? customKey
        : process.env.DEEPSEEK_API_KEY || FALLBACK_DEEPSEEK_KEY;

    return getDeepSeekDirectProvider(deepSeekKey)("deepseek-chat");
  }

  // OpenRouter fallback for non-deepseek models
  return getOpenRouterProvider(customKey)(targetModel || "openai/gpt-4o-mini");
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getOpenRouterProvider()("openai/gpt-4o-mini:online");
}
