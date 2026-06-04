"use server";

import { streamTextWithFallback } from "@/lib/ai/run-with-fallback";

type AIWriterMode = "improve" | "professional" | "shorten" | "simplify" | "generate";

const SYSTEM_PROMPT =
  "You are an expert editor for a premium web design CMS. Your style is minimalist, professional, and clear. When a user asks to improve or rewrite text, focus on removing clutter, improving flow, and maintaining a high-end brand voice. Return only the improved text without any 'Here is the result' introductions.";

function buildInstruction(mode: AIWriterMode) {
  if (mode === "generate")
    return "Write a complete, high-quality draft from the user's prompt. Keep it structured, concise, and publication-ready.";
  if (mode === "professional") return "Rewrite in a polished, corporate, and clean tone.";
  if (mode === "shorten") return "Condense the text while preserving intent.";
  if (mode === "simplify") return "Simplify the language and improve readability while keeping the meaning.";
  return "Improve the writing quality, rhythm, and clarity while preserving intent.";
}

export async function runAIHandler(input: {
  mode: AIWriterMode;
  text: string;
}): Promise<
  { ok: true; text: string } | { ok: false; error: string; reason?: "rate_limit" | "general" }
> {
  const text = input.text.trim();
  if (!text) return { ok: true, text: "" };

  const prompt = [
    `Mode instruction: ${buildInstruction(input.mode)}`,
    "Return only the rewritten text.",
    "",
    "Original:",
    text,
  ].join("\n");

  const result = await streamTextWithFallback({
    tier: "writer",
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0.35,
  });

  if (!result.ok) return result;
  return { ok: true, text: result.text };
}
