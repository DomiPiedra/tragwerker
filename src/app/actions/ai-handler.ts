"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";

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

function isRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = (error as { status?: number }).status;
  const code = String((error as { code?: string }).code ?? "");
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return statusCode === 429 || status === 429 || code.includes("429") || message.includes("429");
}

function isModelNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = (error as { status?: number }).status;
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return statusCode === 404 || status === 404 || message.includes("model") || message.includes("not found");
}

export async function runAIHandler(input: {
  mode: AIWriterMode;
  text: string;
}): Promise<
  { ok: true; text: string } | { ok: false; error: string; reason?: "rate_limit" | "general" }
> {
  const text = input.text.trim();
  if (!text) return { ok: true, text: "" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Missing GEMINI_API_KEY. Add it to .env.local and restart dev server.",
      reason: "general",
    };
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const candidateModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
    ];
    let full = "";
    let succeeded = false;

    for (const modelName of candidateModels) {
      try {
        const prompt = [
          `Mode instruction: ${buildInstruction(input.mode)}`,
          "Return only the rewritten text.",
          "",
          "Original:",
          text,
        ].join("\n");

        const result = streamText({
          model: google(modelName),
          system: SYSTEM_PROMPT,
          prompt,
          temperature: 0.35,
        });

        full = "";
        for await (const delta of result.textStream) {
          full += delta;
        }
        if (full.trim().length > 0) {
          succeeded = true;
          break;
        }

        // Some provider/model combos can return an empty stream; retry once non-streaming.
        const backup = await generateText({
          model: google(modelName),
          system: SYSTEM_PROMPT,
          prompt,
          temperature: 0.35,
        });
        full = backup.text ?? "";
        if (full.trim().length > 0) {
          succeeded = true;
          break;
        }
      } catch (error) {
        if (isRateLimitError(error)) {
          return {
            ok: false,
            error: "AI is resting for a moment...",
            reason: "rate_limit",
          };
        }
        if (!isModelNotFoundError(error)) {
          throw error;
        }
      }
    }

    if (!succeeded) {
      return {
        ok: false,
        error: "Gemini returned no text. Try again with a more specific prompt.",
        reason: "general",
      };
    }

    return { ok: true, text: full.trim() };
  } catch (error) {
    if (isRateLimitError(error)) {
      return {
        ok: false,
        error: "AI is resting for a moment...",
        reason: "rate_limit",
      };
    }
    return {
      ok: false,
      error: "Gemini request failed. Please check key/quota and retry.",
      reason: "general",
    };
  }
}
