"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import {
  buildBlogContentHtml,
  detectImageUsage,
} from "@/lib/ai/command-bar-intent";
import { generateTextWithFallback } from "@/lib/ai/run-with-fallback";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BlogContentGenerationJob } from "@/lib/blog/command-bar-generation";
import type { CommandImageUsage } from "@/types/command-intent";
import { isImageAttachment } from "@/types/command-attachment";

async function loadImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  if (!url.startsWith("/uploads/")) return null;
  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".svg"
              ? "image/svg+xml"
              : "image/jpeg";
    return { data: buffer.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

function paragraphsFromText(text: string) {
  return text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

async function generateBlogDraftWithVision(input: {
  transcript: string;
  title: string;
  imageUsage: CommandImageUsage;
  imageBase64: string;
  mimeType: string;
}): Promise<{ excerpt: string; paragraphs: string[] } | null> {
  const usageInstruction =
    input.imageUsage === "reference"
      ? "Use the attached image only as creative reference. Do NOT describe that you are looking at an image. Write the blog opening in plain paragraphs (no HTML, no markdown)."
      : "Write an opening section for a blog post. The image will be inserted separately — write 1-2 intro paragraphs only (plain text, no HTML).";

  const text = await generateTextWithFallback({
    tier: "vision",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "You are a senior editor for a design studio CMS.",
              `Post title: ${input.title}`,
              `User request: ${input.transcript}`,
              usageInstruction,
              "Return 1-2 short paragraphs, professional tone.",
            ].join("\n"),
          },
          {
            type: "image",
            image: `data:${input.mimeType};base64,${input.imageBase64}`,
          },
        ],
      },
    ],
    temperature: 0.45,
  });

  if (!text) return null;
  const paragraphs = paragraphsFromText(text);
  if (paragraphs.length === 0) return null;
  return { excerpt: paragraphs[0]?.slice(0, 220) ?? "", paragraphs };
}

async function generateTextOnlyDraft(input: {
  transcript: string;
  title: string;
}): Promise<{ excerpt: string; paragraphs: string[] } | null> {
  const text = await generateTextWithFallback({
    tier: "capable",
    prompt: [
      "Write 1-2 short opening paragraphs for a blog post.",
      `Title: ${input.title}`,
      `User request: ${input.transcript}`,
      "Professional tone. Plain text only, no markdown.",
    ].join("\n"),
    temperature: 0.45,
  });

  if (!text) return null;
  const paragraphs = paragraphsFromText(text);
  if (paragraphs.length === 0) return null;
  return { excerpt: paragraphs[0]?.slice(0, 220) ?? "", paragraphs };
}

export async function generateBlogPostContent(input: {
  postId: string;
  job: BlogContentGenerationJob;
}) {
  await requireEditorOrAdmin();

  const post = await prisma.blogPost.findUnique({
    where: { id: input.postId },
    select: { id: true, title: true },
  });
  if (!post) return { ok: false as const, error: "Post not found." };

  const transcript = input.job.transcript.trim();
  const imageUsage =
    input.job.imageUsage ?? detectImageUsage(transcript, input.job.attachments.length > 0);

  const imageAttachments = input.job.attachments.filter(
    (a) => isImageAttachment(a.mimeType) || isImageAttachment(a.originalName)
  );
  const primaryImage = imageAttachments[0];

  let excerpt = "";
  let paragraphs: string[] = [];

  if (primaryImage && imageUsage !== "none") {
    const encoded = await loadImageBase64(primaryImage.url);
    if (encoded) {
      const vision = await generateBlogDraftWithVision({
        transcript,
        title: post.title,
        imageUsage,
        imageBase64: encoded.data,
        mimeType: encoded.mimeType,
      });
      if (vision) {
        excerpt = vision.excerpt;
        paragraphs = vision.paragraphs;
      }
    }
  }

  if (paragraphs.length === 0 && transcript) {
    const textDraft = await generateTextOnlyDraft({ transcript, title: post.title });
    if (textDraft) {
      excerpt = textDraft.excerpt;
      paragraphs = textDraft.paragraphs;
    }
  }

  if (paragraphs.length === 0) {
    paragraphs = [`This post explores ${post.title}. Add more detail when you're ready.`];
  }

  const contentHtml = buildBlogContentHtml({
    bodyParagraphs: paragraphs,
    imageUrl: primaryImage?.url,
    imageAlt: primaryImage?.title ?? primaryImage?.originalName,
    imageUsage,
  });

  const updated = await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      excerpt: excerpt || null,
      content: contentHtml,
    },
  });

  await logActivity({
    entityType: "blogPost",
    entityId: updated.id,
    action: "updated",
    title: updated.title,
    details: "AI content generated from command bar",
  });

  revalidatePath("/blog");

  return {
    ok: true as const,
    contentHtml,
    excerpt: updated.excerpt,
  };
}
