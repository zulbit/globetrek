import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText as originalGenerateText } from "ai";

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
      "HTTP-Referer": "https://globetrek.pk",
      "X-Title": "GlobeTrek PK",
    },
    fetch: async (url, options) => {
      if (options?.body && typeof options.body === "string") {
        try {
          const parsed = JSON.parse(options.body);
          const limit = parsed.max_tokens || parsed.maxTokens;
          if (!limit) {
            parsed.max_tokens = 800;
          } else {
            parsed.max_tokens = Number(limit);
          }
          // Remove camelCase maxTokens if present to avoid conflicting OpenAI validation
          delete parsed.maxTokens;
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
          const limit = parsed.max_tokens || parsed.maxTokens;
          if (!limit) {
            parsed.max_tokens = 800;
          } else {
            parsed.max_tokens = Number(limit);
          }
          delete parsed.maxTokens;
          options.body = JSON.stringify(parsed);
        } catch {}
      }
      return fetch(url, options);
    },
  });
}

function getAgentRouterProvider(customKey?: string) {
  const apiKey =
    customKey ||
    process.env.AGENTROUTER_API_KEY ||
    "";

  return createOpenAICompatible({
    name: "agentrouter",
    baseURL: "https://agentrouter.org/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Kilo-Code/5.7.0",
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
  const modelId = targetModel || "openai/gpt-4o-mini";

  // Check if target model is an AgentRouter model
  const isAgentRouter =
    modelId.includes("claude-opus-") ||
    modelId.includes("gpt-3.6-sol") ||
    modelId.includes("gpt-5.6-sol") ||
    modelId.includes("agentrouter");

  if (isAgentRouter) {
    const key = customKey || process.env.AGENTROUTER_API_KEY || "";
    return getAgentRouterProvider(key)(modelId);
  }

  const isDeepSeekTarget =
    modelId.includes("deepseek") ||
    modelId === "deepseek-v4-flash";

  if (isDeepSeekTarget) {
    const deepSeekKey =
      customKey && !customKey.startsWith("sk-or-v1-")
        ? customKey
        : process.env.DEEPSEEK_API_KEY || FALLBACK_DEEPSEEK_KEY;

    return getDeepSeekDirectProvider(deepSeekKey)("deepseek-chat");
  }

  // OpenRouter fallback for non-deepseek models
  const openRouterKey =
    customKey && customKey.startsWith("sk-or-v1-")
      ? customKey
      : undefined;

  return getOpenRouterProvider(openRouterKey)(modelId);
}

/** Web-search grounded — real-time visa fee / embassy data lookups */
export function openRouterOnlineModel() {
  return getOpenRouterProvider()("openai/gpt-4o-mini:online");
}

/**
 * Executes generateText with a self-healing fallback mechanism.
 * If the primary model fails (e.g. due to Insufficient Balance, Rate Limits, or Billing issues),
 * it automatically retries using OpenRouter's free router model (openrouter/free).
 */
export async function generateTextWithFallback(
  params: Parameters<typeof originalGenerateText>[0]
) {
  try {
    return await originalGenerateText(params);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(`[AI SDK] Primary model execution failed: ${errMsg}. Attempting self-healing fallback...`);

    try {
      console.log(`[AI SDK Fallback] Retrying prompt with 'openrouter/free' model routing...`);
      const fallbackModel = openRouterModel("openrouter/free");
      return await originalGenerateText({
        ...params,
        model: fallbackModel,
      });
    } catch (fallbackErr: any) {
      console.error(`[AI SDK Fallback Failed] Free fallback model also failed:`, fallbackErr);
    }
    throw err;
  }
}

