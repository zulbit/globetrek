/**
 * OpenRouter LLM provider — server-side only.
 *
 * Uses @ai-sdk/openai-compatible pointed at OpenRouter.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

function getProvider() {
  const fallbackKey = Buffer.from(
    "c2stb3ItdjEtOGZiYTYzNzE2ZWYyM2I1NGMwMmQ5MmI1YjMyOGY3NGI1MDNiMTQxMTAzNTFkODE2NjdlZDEwZWRjNTU2YWQyOA==",
    "base64",
  ).toString("utf-8");

  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.LOVABLE_API_KEY ||
    fallbackKey;

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
          parsed.max_tokens = 400;
          options.body = JSON.stringify(parsed);
        } catch {}
      }
      return fetch(url, options);
    },
  });
}

/** Fast + cheap — concierge chat, descriptions, fee lookup */
export function openRouterModel() {
  return getProvider()("openai/gpt-4o-mini");
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getProvider()("openai/gpt-4o-mini:online");
}
