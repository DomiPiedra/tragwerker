import { z } from "zod";

import { buildIntentSystemPrompt, buildIntentUserPrompt } from "@/lib/ai/prompts/intent-prompt";
import { generateObjectWithFallback } from "@/lib/ai/run-with-fallback";
import type { AIProvider, SemanticInterpretation, SemanticRouterRequest } from "@/lib/ai/types";

const intentSchema = z.object({
  commandId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(240),
});

export class IntentProvider implements AIProvider {
  async interpretIntent(input: SemanticRouterRequest): Promise<SemanticInterpretation | null> {
    const object = await generateObjectWithFallback({
      tier: "fast",
      schema: intentSchema,
      system: buildIntentSystemPrompt(),
      prompt: buildIntentUserPrompt(input.input, input.commands),
      temperature: 0.1,
    });

    if (!object) return null;

    return {
      commandId: object.commandId,
      confidence: object.confidence,
      reasoning: object.reasoning,
    };
  }
}
