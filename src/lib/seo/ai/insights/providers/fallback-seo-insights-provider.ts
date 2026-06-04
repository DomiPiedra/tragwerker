import { z } from "zod";

import { generateObjectWithFallback } from "@/lib/ai/run-with-fallback";
import { listContentSeoEntities } from "@/lib/seo/entity-registry";
import type { SeoInsightsProvider } from "@/lib/seo/ai/insights/provider";
import type { SeoInsightsContext, SeoInsightsResult } from "@/lib/seo/ai/insights/types";

const insightsSchema = z.object({
  suggestedSeoTitle: z.string().min(8).max(70).nullable(),
  suggestedMetaDescription: z.string().min(40).max(165).nullable(),
  suggestedKeywords: z.array(z.string().min(2).max(48)).min(3).max(10),
  missingSearchIntent: z
    .object({
      summary: z.string().min(20).max(280),
      suggestions: z.array(z.string().min(8).max(120)).min(1).max(4),
    })
    .nullable(),
  suggestedInternalLinks: z
    .array(
      z.object({
        anchorText: z.string().min(2).max(60),
        targetHint: z.string().min(2).max(120),
        reason: z.string().min(12).max(200),
      })
    )
    .max(5),
  contentOpportunities: z
    .array(
      z.object({
        title: z.string().min(4).max(80),
        detail: z.string().min(20).max(240),
      })
    )
    .min(1)
    .max(5),
});

const SYSTEM_PROMPT = [
  "You are a senior SEO editor reviewing a CMS page before publish.",
  "Output structured recommendations only — never rewrite the full article.",
  "Be specific, concise, and actionable. No filler or generic advice.",
  "Compare existing metadata with the page content; suggest improvements only where justified.",
  "suggestedSeoTitle / suggestedMetaDescription: null if current metadata is already strong.",
  "suggestedKeywords: 5–8 distinct phrases aligned with likely search queries.",
  "missingSearchIntent: explain intent gaps and how to address them; null if intent is clear.",
  "suggestedInternalLinks: plausible on-site paths using collection segments when relevant.",
  "contentOpportunities: concrete editorial gaps (sections, proof points, CTAs) — not metadata tweaks.",
].join(" ");

function buildUserPrompt(context: SeoInsightsContext): string {
  const siteSections = listContentSeoEntities()
    .filter((e) => e.pathSegment)
    .map((e) => `/${e.pathSegment} — ${e.label}`)
    .join("\n");

  return JSON.stringify(
    {
      collectionType: context.collectionType,
      pageTitle: context.title,
      headings: context.headings,
      contentExcerpt: context.content,
      existingMetadata: context.existingMetadata,
      availableSiteSections: siteSections,
    },
    null,
    2
  );
}

function normalizeInsights(raw: z.infer<typeof insightsSchema>): SeoInsightsResult {
  return {
    suggestedSeoTitle: raw.suggestedSeoTitle?.trim() || null,
    suggestedMetaDescription: raw.suggestedMetaDescription?.trim() || null,
    suggestedKeywords: raw.suggestedKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
    missingSearchIntent: raw.missingSearchIntent
      ? {
          summary: raw.missingSearchIntent.summary.trim(),
          suggestions: raw.missingSearchIntent.suggestions.map((s) => s.trim()).filter(Boolean),
        }
      : null,
    suggestedInternalLinks: raw.suggestedInternalLinks.map((link) => ({
      anchorText: link.anchorText.trim(),
      targetHint: link.targetHint.trim(),
      reason: link.reason.trim(),
    })),
    contentOpportunities: raw.contentOpportunities.map((item) => ({
      title: item.title.trim(),
      detail: item.detail.trim(),
    })),
  };
}

export class FallbackSeoInsightsProvider implements SeoInsightsProvider {
  async analyze(context: SeoInsightsContext): Promise<SeoInsightsResult | null> {
    const object = await generateObjectWithFallback({
      tier: "seo",
      schema: insightsSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(context),
      temperature: 0.4,
    });

    if (!object) return null;
    return normalizeInsights(object);
  }
}
