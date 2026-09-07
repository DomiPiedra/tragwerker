import {
  generateObject,
  generateText,
  streamText,
  type ModelMessage,
} from "ai";
import type { z } from "zod";

import { isRateLimitError, isRetryableAIError } from "@/lib/ai/errors";
import { getModelsForTier, hasAnyAIConfigured, type AIModelTier } from "@/lib/ai/model-registry";

export { isRateLimitError, isRetryableAIError } from "@/lib/ai/errors";
export { getPrimaryProviderLabel, hasAnyAIConfigured } from "@/lib/ai/model-registry";

type TextCallOptions = {
  tier: AIModelTier;
  system?: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
};

export async function generateTextWithFallback(
  options: TextCallOptions
): Promise<string | null> {
  const models = getModelsForTier(options.tier);
  if (models.length === 0) return null;

  const { tier: _tier, ...rest } = options;

  for (const model of models) {
    try {
      const result = await generateText({
        model,
        system: rest.system,
        temperature: rest.temperature,
        ...(rest.messages?.length ? { messages: rest.messages } : { prompt: rest.prompt ?? "" }),
      });
      const text = result.text?.trim();
      if (text) return text;
    } catch (error) {
      if (!isRetryableAIError(error)) throw error;
    }
  }

  return null;
}

export async function generateObjectWithFallback<T extends z.ZodType>(options: {
  tier: AIModelTier;
  schema: T;
  system?: string;
  prompt?: string;
  temperature?: number;
}): Promise<z.infer<T> | null> {
  const models = getModelsForTier(options.tier);
  if (models.length === 0) return null;

  const { tier: _tier, schema, ...rest } = options;

  for (const model of models) {
    try {
      const result = await generateObject({
        model,
        schema,
        system: rest.system,
        prompt: rest.prompt ?? "",
        temperature: rest.temperature,
      });
      return result.object as z.infer<T>;
    } catch (error) {
      if (!isRetryableAIError(error)) throw error;
    }
  }

  return null;
}

export async function streamTextWithFallback(
  options: TextCallOptions
): Promise<
  | { ok: true; text: string }
  | { ok: false; error: string; reason?: "rate_limit" | "general" }
> {
  if (!hasAnyAIConfigured()) {
    return {
      ok: false,
      error: "Missing AI API keys. Set AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT (primary) and/or GEMINI_API_KEY (backup) in .env.local.",
      reason: "general",
    };
  }

  const models = getModelsForTier(options.tier);
  if (models.length === 0) {
    return {
      ok: false,
      error: "No AI models configured. Add Azure OpenAI or GEMINI_API_KEY.",
      reason: "general",
    };
  }

  const { tier: _tier, ...rest } = options;

  for (const model of models) {
    try {
      let full = "";
      const streamed = streamText({
        model,
        system: rest.system,
        temperature: rest.temperature,
        ...(rest.messages?.length ? { messages: rest.messages } : { prompt: rest.prompt ?? "" }),
      });
      for await (const delta of streamed.textStream) {
        full += delta;
      }
      if (full.trim().length > 0) {
        return { ok: true, text: full.trim() };
      }

      const backup = await generateText({
        model,
        system: rest.system,
        temperature: rest.temperature,
        ...(rest.messages?.length ? { messages: rest.messages } : { prompt: rest.prompt ?? "" }),
      });
      const text = backup.text?.trim();
      if (text) return { ok: true, text };
    } catch (error) {
      if (!isRetryableAIError(error)) {
        return {
          ok: false,
          error: "AI request failed. Check API keys and quota.",
          reason: "general",
        };
      }
    }
  }

  return {
    ok: false,
    error: "AI is resting or unavailable. Try again in a moment.",
    reason: "rate_limit",
  };
}
