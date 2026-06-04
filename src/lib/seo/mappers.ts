import type { ContentSeo as PrismaContentSeo } from "@/generated/prisma/client";
import { createDefaultContentSeo } from "@/lib/seo/defaults";
import { isContentSeoEntityType, type ContentSeoEntityType } from "@/lib/seo/entity-types";
import type { ContentSeo, ContentSeoRecord } from "@/types/seo";

export function prismaContentSeoToContentSeo(row: PrismaContentSeo): ContentSeo {
  return {
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: [...row.seoKeywords],
    seoImage: row.seoImage,
    canonicalUrl: row.canonicalUrl,
    indexable: row.indexable,
    followLinks: row.followLinks,
  };
}

export function prismaContentSeoToRecord(row: PrismaContentSeo): ContentSeoRecord {
  if (!isContentSeoEntityType(row.entityType)) {
    throw new Error(`Invalid ContentSeo.entityType in database: ${row.entityType}`);
  }

  return {
    ...prismaContentSeoToContentSeo(row),
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    aiGeneratedAt: row.aiGeneratedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mergeContentSeo(
  base: ContentSeo,
  patch: Partial<ContentSeo>
): ContentSeo {
  return {
    seoTitle: patch.seoTitle ?? base.seoTitle,
    seoDescription: patch.seoDescription ?? base.seoDescription,
    seoKeywords: patch.seoKeywords ?? base.seoKeywords,
    seoImage: patch.seoImage ?? base.seoImage,
    canonicalUrl: patch.canonicalUrl ?? base.canonicalUrl,
    indexable: patch.indexable ?? base.indexable,
    followLinks: patch.followLinks ?? base.followLinks,
  };
}

export function normalizeContentSeoInput(
  input: Partial<ContentSeo> | undefined
): ContentSeo {
  const defaults = createDefaultContentSeo();
  if (!input) return defaults;
  return mergeContentSeo(defaults, {
    ...input,
    seoKeywords: input.seoKeywords ? [...input.seoKeywords] : undefined,
  });
}

export function contentSeoRef(
  entityType: ContentSeoEntityType,
  entityId: string
): { entityType: ContentSeoEntityType; entityId: string } {
  return { entityType, entityId };
}
