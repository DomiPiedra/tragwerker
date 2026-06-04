"use server";

import { requireEditorOrAdmin } from "@/lib/auth";
import {
  isContentSeoEntityType,
  type ContentSeoEntityType,
} from "@/lib/seo/entity-types";
import { buildSeoInsightsContext } from "@/lib/seo/insights/build-context";
import { seoInsightsService } from "@/lib/seo/ai/seo-insights-service";
import {
  generateAndPersistSeoFromEditor,
  getContentSeo,
  scheduleContentSeoGeneration,
  upsertContentSeo,
} from "@/lib/seo/server";
import type { SeoInsightsResult } from "@/lib/seo/ai/insights/types";
import type { ContentSeo, ContentSeoRecord, ContentSeoUpdate } from "@/types/seo";

export async function fetchContentSeoRecord(input: {
  entityType: string;
  entityId: string;
}): Promise<{ ok: true; seo: ContentSeoRecord | null } | { ok: false; error: string }> {
  await requireEditorOrAdmin();

  if (!isContentSeoEntityType(input.entityType)) {
    return { ok: false, error: "Invalid collection type." };
  }

  const seo = await getContentSeo({
    entityType: input.entityType,
    entityId: input.entityId,
  });

  return { ok: true, seo };
}

export async function generateContentSeoAction(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  headings?: string[];
}): Promise<{ ok: true; seo: ContentSeoRecord } | { ok: false; error: string }> {
  await requireEditorOrAdmin();

  if (!isContentSeoEntityType(input.entityType)) {
    return { ok: false, error: "Invalid collection type." };
  }

  const entityType = input.entityType as ContentSeoEntityType;

  return generateAndPersistSeoFromEditor({
    entityType,
    entityId: input.entityId,
    title: input.title,
    content: input.content,
    headings: input.headings,
  });
}

export async function saveContentSeoAction(input: {
  entityType: string;
  entityId: string;
  seo: ContentSeoUpdate;
}): Promise<{ ok: true; seo: ContentSeoRecord } | { ok: false; error: string }> {
  await requireEditorOrAdmin();

  if (!isContentSeoEntityType(input.entityType)) {
    return { ok: false, error: "Invalid collection type." };
  }

  const seo = await upsertContentSeo(
    { entityType: input.entityType, entityId: input.entityId },
    input.seo
  );

  return { ok: true, seo };
}

export async function generateSeoInsightsAction(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  headings?: string[];
  existingMetadata: ContentSeo;
}): Promise<
  { ok: true; insights: SeoInsightsResult; generatedAt: string } | { ok: false; error: string }
> {
  await requireEditorOrAdmin();

  if (!isContentSeoEntityType(input.entityType)) {
    return { ok: false, error: "Invalid collection type." };
  }

  const context = buildSeoInsightsContext({
    entityType: input.entityType,
    title: input.title,
    content: input.content,
    headings: input.headings,
    existingMetadata: input.existingMetadata,
  });

  const insights = await seoInsightsService.analyze(context);
  if (!insights) {
    return {
      ok: false,
      error: "AI could not generate SEO insights. Check API keys and try again.",
    };
  }

  return { ok: true, insights, generatedAt: new Date().toISOString() };
}

export async function scheduleContentSeoAction(input: {
  entityType: string;
  entityId: string;
}) {
  await requireEditorOrAdmin();

  if (!isContentSeoEntityType(input.entityType)) {
    return { ok: false as const, error: "Invalid collection type." };
  }

  scheduleContentSeoGeneration(input.entityType, input.entityId);
  return { ok: true as const };
}
