"use server";

import { z } from "zod";

import {
  detectImageUsage,
  extractBlogTitle,
  isBlogCreateRequest,
} from "@/lib/ai/command-bar-intent";
import { buildIntentSystemPrompt } from "@/lib/ai/prompts/intent-prompt";
import {
  generateObjectWithFallback,
  generateTextWithFallback,
  hasAnyAIConfigured,
} from "@/lib/ai/run-with-fallback";
import { requireEditorOrAdmin } from "@/lib/auth";
import type {
  CommandBarIntentResult,
  CommandImageUsage,
  ProcessCommandBarIntentInput,
} from "@/types/command-intent";
import { isImageAttachment } from "@/types/command-attachment";

const intentSchema = z.object({
  commandId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(280),
  blogTitle: z.string().nullable().optional(),
  imageUsage: z.enum(["none", "embed", "reference"]).optional(),
});

const PLACEHOLDER_TITLE = /^(untitled\s*post|new\s*post|new\s*article)$/i;

async function generateTitleFromContext(transcript: string): Promise<string | null> {
  if (!hasAnyAIConfigured()) {
    const words = transcript
      .replace(/\b(create|new|write|blog|post|article|with|the|topic|about)\b/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 6);
    return words.length > 0 ? words.join(" ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  }

  const text = await generateTextWithFallback({
    tier: "fast",
    prompt: [
      "Generate a concise blog post title (max 10 words) from the user request.",
      "Return only the title text, no quotes or punctuation wrapper.",
      "",
      transcript,
    ].join("\n"),
    temperature: 0.25,
  });

  if (!text) return null;
  const title = text.replace(/^["']|["']$/g, "").slice(0, 120);
  return title.length >= 2 ? title : null;
}

export async function processCommandBarIntent(
  input: ProcessCommandBarIntentInput
): Promise<CommandBarIntentResult> {
  await requireEditorOrAdmin();

  const transcript = input.transcript.trim();
  if (!transcript) {
    return { commandId: null, confidence: 0, reasoning: "empty" };
  }

  const imageAttachments = (input.attachments ?? []).filter(
    (a) => isImageAttachment(a.mimeType) || isImageAttachment(a.originalName)
  );
  const hasImages = imageAttachments.length > 0;
  const heuristicImageUsage = detectImageUsage(transcript, hasImages);
  const heuristicTitle = extractBlogTitle(transcript);
  const wantsBlog = isBlogCreateRequest(transcript);

  let parsed: z.infer<typeof intentSchema> | null = null;

  if (hasAnyAIConfigured() && wantsBlog) {
    parsed = await generateObjectWithFallback({
      tier: "fast",
      schema: intentSchema,
      system: [
        buildIntentSystemPrompt(),
        "Fast path only: map blog create intent and extract blogTitle + imageUsage.",
        "Do not write blog body content.",
        "commandId = create-blog-post when user wants a new blog/article/post.",
      ].join(" "),
      prompt: JSON.stringify({
        transcript,
        hasImageAttachments: hasImages,
        commands: input.commands,
      }),
      temperature: 0.1,
    });
  } else if (hasAnyAIConfigured()) {
    parsed = await generateObjectWithFallback({
      tier: "fast",
      schema: intentSchema,
      system: buildIntentSystemPrompt(),
      prompt: JSON.stringify({ transcript, commands: input.commands }),
      temperature: 0.1,
    });
  }

  const commandId = parsed?.commandId ?? (wantsBlog ? "create-blog-post" : null) ?? null;

  const confidence = parsed?.confidence ?? (wantsBlog ? 0.82 : 0.25);

  if (commandId !== "create-blog-post") {
    return {
      commandId: commandId && input.commands.some((c) => c.id === commandId) ? commandId : null,
      confidence,
      reasoning: parsed?.reasoning ?? "intent-map",
    };
  }

  const imageUsage: CommandImageUsage =
    parsed?.imageUsage ?? heuristicImageUsage ?? (hasImages ? "embed" : "none");

  let title = parsed?.blogTitle?.trim() || heuristicTitle || "";

  if (!title || PLACEHOLDER_TITLE.test(title)) {
    const generated = await generateTitleFromContext(transcript);
    title = generated || title || "Untitled Post";
  }

  return {
    commandId: "create-blog-post",
    confidence: Math.max(confidence, 0.75),
    reasoning: parsed?.reasoning ?? "blog-create-fast",
    payload: {
      blog: {
        title,
        contentHtml: "<p></p>",
        imageUsage,
        deferContentGeneration: true,
        generationContext: {
          transcript,
          imageUsage,
          attachments: (input.attachments ?? []).map((a) => ({
            id: a.id,
            url: a.url,
            title: a.title,
            originalName: a.originalName,
            mimeType: a.mimeType,
          })),
        },
      },
    },
  };
}
