import { seoMetadataService } from "@/lib/seo/ai/seo-metadata-service";
import { getContentSeoEntityDefinition } from "@/lib/seo/entity-registry";
import { prismaContentSeoToRecord } from "@/lib/seo/mappers";
import { ensureContentSeo, getContentSeo } from "@/lib/seo/repository";
import { buildSeoContextFromEditor, loadSeoContentContext } from "@/lib/seo/server/load-context";
import { prisma } from "@/lib/prisma";
import type { ContentSeoEntityType, ContentSeoRecord, SeoGenerationContext } from "@/types/seo";
import type { ContentSeoRef } from "@/types/seo";

export async function generateAndPersistSeoMetadata(
  ref: ContentSeoRef,
  context: SeoGenerationContext
): Promise<{ ok: true; seo: ContentSeoRecord } | { ok: false; error: string }> {
  const draft = await seoMetadataService.generateDraft(context);
  if (!draft) {
    return { ok: false, error: "AI could not generate SEO metadata. Check API keys and try again." };
  }

  await ensureContentSeo(ref);
  const existing = await getContentSeo(ref);

  const row = await prisma.contentSeo.update({
    where: {
      entityType_entityId: {
        entityType: ref.entityType,
        entityId: ref.entityId,
      },
    },
    data: {
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      seoKeywords: draft.seoKeywords,
      seoImage: existing?.seoImage ?? "",
      canonicalUrl: existing?.canonicalUrl ?? "",
      indexable: existing?.indexable ?? true,
      followLinks: existing?.followLinks ?? true,
      aiGeneratedAt: new Date(),
    },
  });

  return { ok: true, seo: prismaContentSeoToRecord(row) };
}

export async function generateAndPersistSeoFromDb(
  entityType: ContentSeoEntityType,
  entityId: string
): Promise<void> {
  const context = await loadSeoContentContext(entityType, entityId);
  if (!context) return;

  const result = await generateAndPersistSeoMetadata(
    { entityType, entityId },
    context
  );

  if (!result.ok) {
    console.error(`[seo] background generation failed for ${entityType}/${entityId}:`, result.error);
  }
}

export async function generateAndPersistSeoFromEditor(input: {
  entityType: ContentSeoEntityType;
  entityId: string;
  title: string;
  content: string;
  headings?: string[];
}) {
  const label = getContentSeoEntityDefinition(input.entityType).label;
  const context = buildSeoContextFromEditor({
    title: input.title,
    content: input.content,
    headings: input.headings,
    collectionType: label,
  });

  return generateAndPersistSeoMetadata(
    { entityType: input.entityType, entityId: input.entityId },
    context
  );
}
