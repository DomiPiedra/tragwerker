import type { CommandMetadata } from "@/lib/ai/types";

export function buildIntentSystemPrompt() {
  return [
    "You map natural language user intent to deterministic CMS commands.",
    "You are NOT a chatbot. You do not explain features.",
    "Return strict JSON only.",
    "If no good match exists, return commandId = null and low confidence.",
    "Prefer exact operational intent over generic similarity.",
    "Confidence must be between 0 and 1.",
  ].join(" ");
}

export function buildIntentUserPrompt(input: string, commands: CommandMetadata[]) {
  return JSON.stringify({
    task: "Map user intent to one command id.",
    input,
    commands,
    outputSchema: {
      commandId: "string | null",
      confidence: "number (0..1)",
      reasoning: "short deterministic reason",
    },
  });
}
