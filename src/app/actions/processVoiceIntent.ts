"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import type { CommandMetadata, SemanticInterpretation } from "@/lib/ai";

const voiceActionSchema = z.object({
  action: z.enum(["navigate", "modal", "search", "unknown"]),
  route: z.string().optional(),
  target: z.string().optional(),
  query: z.string().optional(),
  commandId: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

function scoreCommand(command: CommandMetadata, parts: string[]) {
  const title = command.title.toLowerCase();
  const bag = [title, command.description.toLowerCase(), ...command.keywords, ...command.aliases].join(" ");
  return parts.reduce((acc, part) => (bag.includes(part) ? acc + 1 : acc), 0);
}

function pickCommandByText(commands: CommandMetadata[], text: string) {
  const parts = text
    .toLowerCase()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2);
  if (parts.length === 0) return null;
  const ranked = commands
    .map((command) => ({ command, score: scoreCommand(command, parts) }))
    .sort((a, b) => b.score - a.score || b.command.priority - a.command.priority);
  return ranked[0] && ranked[0].score > 0 ? ranked[0].command : null;
}

export async function processVoiceIntent(input: {
  transcript: string;
  commands: CommandMetadata[];
}): Promise<SemanticInterpretation | null> {
  const text = input.transcript.trim();
  if (!text) return null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const google = createGoogleGenerativeAI({ apiKey });
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: voiceActionSchema,
      system: [
        "You are the brain of a premium CMS.",
        "The user is speaking a command.",
        "Translate this speech into a JSON action.",
        "Examples:",
        "'Go to my blog' -> { action: 'navigate', route: '/blog' }",
        "'New portfolio entry' -> { action: 'modal', target: 'portfolio' }",
        "'Show me my last 3 team members' -> { action: 'search', query: 'team' }",
        "Additionally, pick the best commandId from the provided command list when possible.",
        "Return strict JSON only.",
      ].join(" "),
      prompt: JSON.stringify({
        transcript: text,
        commands: input.commands.map((command) => ({
          id: command.id,
          title: command.title,
          description: command.description,
          keywords: command.keywords,
          aliases: command.aliases,
        })),
      }),
      temperature: 0.1,
    });

    const directCommand =
      object.commandId && input.commands.some((command) => command.id === object.commandId)
        ? input.commands.find((command) => command.id === object.commandId) ?? null
        : null;
    const mappedText = [object.route, object.target, object.query].filter(Boolean).join(" ");
    const fallbackCommand = pickCommandByText(input.commands, mappedText || text);
    const picked = directCommand ?? fallbackCommand;

    return {
      commandId: picked?.id ?? null,
      confidence: object.confidence ?? (picked ? 0.74 : 0.2),
      reasoning: `voice:${object.action}`,
    };
  } catch {
    return null;
  }
}
