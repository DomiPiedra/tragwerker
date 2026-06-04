import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import { buildIntentSystemPrompt, buildIntentUserPrompt } from "@/lib/ai/prompts/intent-prompt";
import type { AIProvider, SemanticInterpretation, SemanticRouterRequest } from "@/lib/ai/types";

const intentSchema = z.object({
  commandId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(240),
});

export class GeminiProvider implements AIProvider {
  async interpretIntent(input: SemanticRouterRequest): Promise<SemanticInterpretation | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const google = createGoogleGenerativeAI({ apiKey });
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: intentSchema,
      system: buildIntentSystemPrompt(),
      prompt: buildIntentUserPrompt(input.input, input.commands),
      temperature: 0.1,
    });

    return {
      commandId: object.commandId,
      confidence: object.confidence,
      reasoning: object.reasoning,
    };
  }
}
