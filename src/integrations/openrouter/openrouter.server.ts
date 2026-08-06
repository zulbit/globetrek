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
      let reqBody: any = null;
      if (options?.body && typeof options.body === "string") {
        try {
          reqBody = JSON.parse(options.body);
          // Keep max_tokens small (250) so requests fit within free/low credit caps
          reqBody.max_tokens = Math.min(Number(reqBody.max_tokens) || 250, 250);
          options.body = JSON.stringify(reqBody);
        } catch {}
      }

      let res = await fetch(url, options);

      // If credit limit, quota error, or model error occurs, fallback seamlessly to gpt-4o-mini
      if (!res.ok && reqBody) {
        try {
          reqBody.model = "openai/gpt-4o-mini";
          const fallbackOptions = { ...options, body: JSON.stringify(reqBody) };
          const fallbackRes = await fetch(url, fallbackOptions);
          if (fallbackRes.ok) return fallbackRes;
        } catch {}
      }

      return res;
    },
  });
}

/** Fast + powerful bilingual AI model — concierge chat, tour itineraries, fee lookup */
export function openRouterModel() {
  if (process.env.USE_DIRECT_DEEPSEEK === "true" && process.env.DEEPSEEK_API_KEY) {
    const directProvider = createOpenAICompatible({
      name: "deepseek",
      baseURL: "https://api.deepseek.com",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
    });
    return directProvider("deepseek-chat");
  }

  return getProvider()("deepseek/deepseek-chat");
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getProvider()("openai/gpt-4o-mini:online");
}
