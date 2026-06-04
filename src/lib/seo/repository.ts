import { isRegisteredContentSeoEntity } from "@/lib/seo/entity-registry";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { createDefaultContentSeo } from "@/lib/seo/defaults";
import {
  normalizeContentSeoInput,
  prismaContentSeoToContentSeo,
  prismaContentSeoToRecord,
} from "@/lib/seo/mappers";
import { prisma } from "@/lib/prisma";
import type { ContentSeo, ContentSeoRecord, ContentSeoRef, ContentSeoUpdate } from "@/types/seo";

function assertEntityType(entityType: string): asserts entityType is ContentSeoEntityType {
  if (!isRegisteredContentSeoEntity(entityType)) {
    throw new Error(`SEO is not enabled for entity type: ${entityType}`);
  }
}

export async function getContentSeo(
  ref: ContentSeoRef
): Promise<ContentSeoRecord | null> {
  assertEntityType(ref.entityType);

  const row = await prisma.contentSeo.findUnique({
    where: {
      entityType_entityId: {
        entityType: ref.entityType,
        entityId: ref.entityId,
      },
    },
  });

  return row ? prismaContentSeoToRecord(row) : null;
}

export async function getContentSeoData(ref: ContentSeoRef): Promise<ContentSeo> {
  const record = await getContentSeo(ref);
  return record ?? createDefaultContentSeo();
}

/** Returns existing SEO row or creates one with defaults. */
export async function ensureContentSeo(ref: ContentSeoRef): Promise<ContentSeoRecord> {
  assertEntityType(ref.entityType);

  const existing = await prisma.contentSeo.findUnique({
    where: {
      entityType_entityId: {
        entityType: ref.entityType,
        entityId: ref.entityId,
      },
    },
  });

  if (existing) return prismaContentSeoToRecord(existing);

  const defaults = createDefaultContentSeo();
  const created = await prisma.contentSeo.create({
    data: {
      entityType: ref.entityType,
      entityId: ref.entityId,
      ...defaults,
    },
  });

  return prismaContentSeoToRecord(created);
}

export async function upsertContentSeo(
  ref: ContentSeoRef,
  update: ContentSeoUpdate
): Promise<ContentSeoRecord> {
  assertEntityType(ref.entityType);

  const current = await getContentSeo(ref);
  const merged = normalizeContentSeoInput(
    current ? { ...current, ...update } : update
  );

  const row = await prisma.contentSeo.upsert({
    where: {
      entityType_entityId: {
        entityType: ref.entityType,
        entityId: ref.entityId,
      },
    },
    create: {
      entityType: ref.entityType,
      entityId: ref.entityId,
      ...merged,
    },
    update: merged,
  });

  return prismaContentSeoToRecord(row);
}

export async function deleteContentSeo(ref: ContentSeoRef): Promise<void> {
  assertEntityType(ref.entityType);

  await prisma.contentSeo.deleteMany({
    where: {
      entityType: ref.entityType,
      entityId: ref.entityId,
    },
  });
}

/** Load SEO for many items of the same collection (e.g. list views). */
export async function getContentSeoBatch(
  entityType: ContentSeoEntityType,
  entityIds: string[]
): Promise<Map<string, ContentSeo>> {
  assertEntityType(entityType);

  if (entityIds.length === 0) return new Map();

  const rows = await prisma.contentSeo.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
    },
  });

  const map = new Map<string, ContentSeo>();
  for (const id of entityIds) {
    map.set(id, createDefaultContentSeo());
  }
  for (const row of rows) {
    map.set(row.entityId, prismaContentSeoToContentSeo(row));
  }
  return map;
}
