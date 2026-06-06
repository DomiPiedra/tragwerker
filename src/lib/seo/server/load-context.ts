import { getContentSeoEntityDefinition } from "@/lib/seo/entity-registry";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { clipContentForSeo, extractHeadingsFromContent } from "@/lib/seo/extract-headings";
import { prisma } from "@/lib/prisma";
import type { SeoGenerationContext } from "@/types/seo";

export async function loadSeoContentContext(
  entityType: ContentSeoEntityType,
  entityId: string
): Promise<SeoGenerationContext | null> {
  const label = getContentSeoEntityDefinition(entityType).label;

  switch (entityType) {
    case "blogPost": {
      const row = await prisma.blogPost.findUnique({
        where: { id: entityId },
        select: { title: true, excerpt: true, content: true },
      });
      if (!row) return null;
      const body = [row.excerpt ?? "", row.content ?? ""].filter(Boolean).join("\n\n");
      return buildContext(label, row.title, body);
    }
    case "project": {
      const row = await prisma.project.findUnique({
        where: { id: entityId },
        select: { name: true, description: true, category: true },
      });
      if (!row) return null;
      const body = [row.category, row.description ?? ""].filter(Boolean).join("\n\n");
      return buildContext(label, row.name, body);
    }
    case "portfolioItem": {
      const row = await prisma.portfolioItem.findUnique({
        where: { id: entityId },
        select: { title: true, summary: true },
      });
      if (!row) return null;
      return buildContext(label, row.title, row.summary ?? "");
    }
    case "teamMember": {
      const row = await prisma.teamMember.findUnique({
        where: { id: entityId },
        select: { name: true, role: true, bio: true },
      });
      if (!row) return null;
      const body = [row.role, row.bio ?? ""].filter(Boolean).join("\n\n");
      return buildContext(label, row.name, body);
    }
    case "event": {
      const row = await prisma.event.findUnique({
        where: { id: entityId },
        select: { title: true, location: true, description: true },
      });
      if (!row) return null;
      const body = [row.location ?? "", row.description ?? ""].filter(Boolean).join("\n\n");
      return buildContext(label, row.title, body);
    }
    case "property": {
      const row = await prisma.property.findUnique({
        where: { id: entityId },
        select: { title: true, address: true, status: true },
      });
      if (!row) return null;
      const body = [row.address ?? "", row.status].filter(Boolean).join("\n\n");
      return buildContext(label, row.title, body);
    }
    case "page": {
      const row = await prisma.page.findUnique({
        where: { id: entityId },
        select: { title: true, body: true },
      });
      if (!row) return null;
      return buildContext(label, row.title, row.body ?? "");
    }
    case "service": {
      const row = await prisma.service.findUnique({
        where: { id: entityId },
        select: { title: true, summary: true },
      });
      if (!row) return null;
      return buildContext(label, row.title, row.summary ?? "");
    }
    case "job": {
      const row = await prisma.job.findUnique({
        where: { id: entityId },
        select: {
          title: true,
          position: true,
          department: true,
          location: true,
          shortDescription: true,
          content: true,
          responsibilities: true,
          requirements: true,
          benefits: true,
        },
      });
      if (!row) return null;
      const body = [
        row.position ?? "",
        row.department ?? "",
        row.location ?? "",
        row.shortDescription ?? "",
        row.content ?? "",
        row.responsibilities ?? "",
        row.requirements ?? "",
        row.benefits ?? "",
      ]
        .filter(Boolean)
        .join("\n\n");
      return buildContext(label, row.title, body);
    }
    default:
      return null;
  }
}

function buildContext(
  collectionType: string,
  title: string,
  rawContent: string
): SeoGenerationContext {
  const content = clipContentForSeo(rawContent);
  return {
    title: title.trim() || "Untitled",
    content,
    headings: extractHeadingsFromContent(rawContent),
    collectionType,
  };
}

export function buildSeoContextFromEditor(input: {
  title: string;
  content: string;
  headings?: string[];
  collectionType: string;
}): SeoGenerationContext {
  const raw = input.content ?? "";
  return {
    title: input.title.trim() || "Untitled",
    content: clipContentForSeo(raw),
    headings:
      input.headings && input.headings.length > 0
        ? input.headings
        : extractHeadingsFromContent(raw),
    collectionType: input.collectionType,
  };
}
