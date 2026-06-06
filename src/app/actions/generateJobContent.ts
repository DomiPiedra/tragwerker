"use server";

import { revalidatePath } from "next/cache";

import { generateTextWithFallback } from "@/lib/ai/run-with-fallback";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { serializeJob } from "@/lib/jobs/serialize";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export async function generateJobContent(input: { jobId: string }) {
  await requireEditorOrAdmin();
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job) return { ok: false as const, error: "Job not found." };

  const context = [
    job.title,
    job.position ? `Position: ${job.position}` : "",
    job.department ? `Department: ${job.department}` : "",
    job.location ? `Location: ${job.location}` : "",
    job.shortDescription ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const text = await generateTextWithFallback({
    tier: "fast",
    temperature: 0.4,
    system: [
      "You write professional job posting content for a company careers page.",
      "Return plain text only — no markdown, no HTML.",
      "Structure your response in four labeled sections separated by blank lines:",
      "OVERVIEW: 2-3 paragraphs about the role.",
      "RESPONSIBILITIES: bullet-style lines, one per line, prefixed with - ",
      "REQUIREMENTS: bullet-style lines, one per line, prefixed with - ",
      "BENEFITS: bullet-style lines, one per line, prefixed with - ",
    ].join(" "),
    prompt: `Write job posting content for:\n${context}`,
  });

  if (!text?.trim()) {
    return { ok: false as const, error: "AI could not generate job content. Check API keys and try again." };
  }

  const sections = {
    overview: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
  };

  let current: keyof typeof sections = "overview";
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();
    if (upper.startsWith("OVERVIEW")) {
      current = "overview";
      continue;
    }
    if (upper.startsWith("RESPONSIBILITIES")) {
      current = "responsibilities";
      continue;
    }
    if (upper.startsWith("REQUIREMENTS")) {
      current = "requirements";
      continue;
    }
    if (upper.startsWith("BENEFITS")) {
      current = "benefits";
      continue;
    }
    sections[current] += (sections[current] ? "\n" : "") + trimmed;
  }

  const overviewParagraphs = sections.overview
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const contentHtml = paragraphsToHtml(overviewParagraphs);

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      content: contentHtml || job.content,
      responsibilities: sections.responsibilities || job.responsibilities,
      requirements: sections.requirements || job.requirements,
      benefits: sections.benefits || job.benefits,
      shortDescription:
        job.shortDescription ||
        (overviewParagraphs[0]?.slice(0, 280) ?? null),
    },
  });

  await logActivity({
    entityType: "job",
    entityId: updated.id,
    action: "updated",
    title: updated.title,
    details: "AI content generated for job posting",
  });

  revalidatePath("/jobs");
  scheduleContentSeoGeneration("job", updated.id);

  return {
    ok: true as const,
    job: serializeJob(updated),
    contentHtml: updated.content ?? "",
  };
}
