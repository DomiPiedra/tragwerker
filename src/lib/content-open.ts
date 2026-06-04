import { activityEntityHref } from "@/lib/activity-log";
import {
  CONTENT_ENTITY_TYPES,
  contentPathLabel,
  type ContentEntityType,
  type DashboardRecentBoard,
} from "@/lib/content-open-shared";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export {
  CONTENT_ENTITY_TYPES,
  contentPathLabel,
  type ContentEntityType,
  type DashboardRecentBoard,
} from "@/lib/content-open-shared";

const ENTITY_LABELS: Record<ContentEntityType, string> = {
  project: "Project",
  blogPost: "Blog",
  portfolioItem: "Portfolio",
  teamMember: "Team",
  event: "Event",
  property: "Immobilien",
};

function clipPreview(text: string | null | undefined, max = 80): string {
  if (!text?.trim()) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function dedupeRecentOpens<T extends { entityType: string; entityId: string; openedAt: Date }>(
  rows: T[]
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = `${row.entityType}:${row.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= 24) break;
  }
  return out;
}

export async function recordContentOpen(input: {
  entityType: ContentEntityType;
  entityId: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  if (!CONTENT_ENTITY_TYPES.includes(input.entityType)) {
    return { ok: false as const, error: "Invalid entity type" };
  }

  await prisma.contentOpen.upsert({
    where: {
      userId_entityType_entityId: {
        userId: user.id,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: {
      userId: user.id,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    update: { openedAt: new Date() },
  });

  return { ok: true as const };
}

async function resolveEntity(
  entityType: ContentEntityType,
  entityId: string
): Promise<{
  title: string;
  slug: string;
  previewCells: string[];
} | null> {
  switch (entityType) {
    case "project": {
      const row = await prisma.project.findUnique({
        where: { id: entityId },
        select: { name: true, slug: true, category: true, status: true, description: true },
      });
      if (!row) return null;
      return {
        title: row.name,
        slug: row.slug,
        previewCells: [
          row.category,
          String(row.status),
          clipPreview(row.description),
          ENTITY_LABELS.project,
        ],
      };
    }
    case "blogPost": {
      const row = await prisma.blogPost.findUnique({
        where: { id: entityId },
        select: { title: true, slug: true, excerpt: true, published: true },
      });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        previewCells: [
          row.published ? "Published" : "Draft",
          clipPreview(row.excerpt),
          row.slug,
          ENTITY_LABELS.blogPost,
        ],
      };
    }
    case "portfolioItem": {
      const row = await prisma.portfolioItem.findUnique({
        where: { id: entityId },
        select: { title: true, slug: true, status: true, summary: true },
      });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        previewCells: [
          String(row.status),
          clipPreview(row.summary),
          row.slug,
          ENTITY_LABELS.portfolioItem,
        ],
      };
    }
    case "teamMember": {
      const row = await prisma.teamMember.findUnique({
        where: { id: entityId },
        select: { name: true, role: true, bio: true },
      });
      if (!row) return null;
      const slug = row.name.toLowerCase().replace(/\s+/g, "-");
      return {
        title: row.name,
        slug,
        previewCells: [row.role, clipPreview(row.bio), slug, ENTITY_LABELS.teamMember],
      };
    }
    case "event": {
      const row = await prisma.event.findUnique({
        where: { id: entityId },
        select: { title: true, slug: true, location: true, description: true },
      });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        previewCells: [
          row.location ?? "",
          clipPreview(row.description),
          row.slug,
          ENTITY_LABELS.event,
        ],
      };
    }
    case "property": {
      const row = await prisma.property.findUnique({
        where: { id: entityId },
        select: { title: true, slug: true, address: true, status: true },
      });
      if (!row) return null;
      return {
        title: row.title,
        slug: row.slug,
        previewCells: [
          row.address ?? "",
          row.status,
          row.slug,
          ENTITY_LABELS.property,
        ],
      };
    }
    default:
      return null;
  }
}

export async function getDashboardRecentBoards(scope: "all" | "mine", userId: string) {
  const rows = await prisma.contentOpen.findMany({
    where: scope === "mine" ? { userId } : undefined,
    orderBy: { openedAt: "desc" },
    take: 96,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      openedAt: true,
    },
  });

  const deduped = dedupeRecentOpens(rows);
  const boards: DashboardRecentBoard[] = [];

  for (const row of deduped) {
    if (!CONTENT_ENTITY_TYPES.includes(row.entityType as ContentEntityType)) continue;
    const entityType = row.entityType as ContentEntityType;
    const resolved = await resolveEntity(entityType, row.entityId);
    if (!resolved) continue;

    boards.push({
      id: row.id,
      title: resolved.title,
      pathLabel: contentPathLabel(entityType, resolved.slug),
      href: activityEntityHref(entityType, row.entityId),
      openedAt: row.openedAt.toISOString(),
      previewCells: [resolved.title, resolved.slug, ...resolved.previewCells],
    });
  }

  return boards;
}
