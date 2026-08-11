import { z } from "zod";

import { generateObjectWithFallback, hasAnyAIConfigured } from "@/lib/ai/run-with-fallback";
import type {
  AnalyticsBriefContext,
  AnalyticsBriefResult,
  AnalyticsInsightsProvider,
} from "@/lib/analytics/insights/types";
import { editorDeepLink } from "@/lib/analytics/map-path";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { isRegisteredContentSeoEntity } from "@/lib/seo/entity-registry";

const briefSchema = z.object({
  summary: z.string().min(40).max(400),
  actions: z
    .array(
      z.object({
        title: z.string().min(8).max(80),
        detail: z.string().min(20).max(220),
        entityTitle: z.string().min(2).max(120),
        entityType: z.string().nullable(),
        reasonPriority: z.number().min(1).max(10),
      })
    )
    .min(3)
    .max(7),
});

const SYSTEM_PROMPT = [
  "You are a CMS content strategist interpreting Google Analytics for editors.",
  "Speak in plain language about CMS content items — never GA jargon dumps.",
  "Propose 3–7 concrete edit actions (update intro, refresh hero, thicken thin pages, fix drop-off).",
  "Each action must name a specific content title from the input when possible.",
  "Prioritize quiet published pages, falling movers, and high-exit landings.",
].join(" ");

function buildUserPrompt(context: AnalyticsBriefContext): string {
  return JSON.stringify(context, null, 2);
}

export class FallbackAnalyticsInsightsProvider implements AnalyticsInsightsProvider {
  async generateBrief(context: AnalyticsBriefContext): Promise<AnalyticsBriefResult | null> {
    if (!hasAnyAIConfigured()) return null;

    const raw = await generateObjectWithFallback({
      tier: "seo",
      schema: briefSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(context),
      temperature: 0.4,
    });

    if (!raw) return null;

    // Match entity titles back to context for edit links when possible
    return {
      summary: raw.summary.trim(),
      actions: raw.actions
        .sort((a, b) => a.reasonPriority - b.reasonPriority)
        .map((a) => {
          const entityType =
            a.entityType && isRegisteredContentSeoEntity(a.entityType)
              ? (a.entityType as ContentSeoEntityType)
              : null;
          return {
            title: a.title.trim(),
            detail: a.detail.trim(),
            entityTitle: a.entityTitle.trim(),
            entityType,
            entityId: null,
            editHref: null,
          };
        }),
    };
  }
}

export function resolveBriefEditLinks(
  brief: AnalyticsBriefResult,
  catalog: Array<{
    title: string;
    entityType: ContentSeoEntityType;
    entityId: string;
  }>
): AnalyticsBriefResult {
  const byTitle = new Map(catalog.map((c) => [c.title.toLowerCase(), c]));
  return {
    summary: brief.summary,
    actions: brief.actions.map((action) => {
      const hit =
        byTitle.get(action.entityTitle.toLowerCase()) ??
        catalog.find((c) =>
          action.entityTitle.toLowerCase().includes(c.title.toLowerCase())
        );
      if (!hit) return action;
      return {
        ...action,
        entityType: hit.entityType,
        entityId: hit.entityId,
        editHref: editorDeepLink(hit.entityType, hit.entityId),
      };
    }),
  };
}

export function getAnalyticsInsightsProvider(): AnalyticsInsightsProvider {
  return new FallbackAnalyticsInsightsProvider();
}
