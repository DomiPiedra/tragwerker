"use server";

import { revalidatePath } from "next/cache";

import { ProjectStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import {
  normalizePortfolioDetails,
  parsePortfolioDetails,
  type PortfolioDetailRow,
} from "@/lib/portfolio/details";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "item";
}

function parseProjectStatus(raw: string | undefined | null): ProjectStatus {
  const v = (raw ?? "").trim();
  if (v === ProjectStatus.Published || v === "Published") return ProjectStatus.Published;
  if (v === ProjectStatus.InReview || v === "In Review") return ProjectStatus.InReview;
  return ProjectStatus.Draft;
}

function parseOptionalUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  return value ? value : null;
}

function parseOptionalText(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || value === "<p></p>") return null;
  return value;
}

function parseGalleryUrls(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseSortOrder(raw: string | null | undefined): number {
  const n = Number.parseInt(raw?.trim() ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

function serializePortfolioItem(item: {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  summary: string | null;
  content: string | null;
  websiteUrl: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  sortOrder: number;
  details: unknown;
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    status: item.status,
    summary: item.summary,
    content: item.content,
    websiteUrl: item.websiteUrl,
    heroImageUrl: item.heroImageUrl,
    galleryUrls: item.galleryUrls,
    sortOrder: item.sortOrder,
    details: normalizePortfolioDetails(item.details),
    updatedAt: item.updatedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
  };
}

function revalidatePortfolioPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath(`/work/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/work/${previousSlug}`);
  }
}

export async function createPortfolioQuick() {
  await requireEditorOrAdmin();
  const baseTitle = "Untitled Portfolio Item";
  const baseSlug = slugify(baseTitle);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.portfolioItem.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const max = await prisma.portfolioItem.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  const item = await prisma.portfolioItem.create({
    data: {
      title: baseTitle,
      slug: candidate,
      status: ProjectStatus.Draft,
      summary: null,
      content: null,
      websiteUrl: null,
      heroImageUrl: null,
      galleryUrls: [],
      sortOrder,
      details: [],
    },
  });

  await logActivity({
    entityType: "portfolioItem",
    entityId: item.id,
    action: "created",
    title: item.title,
    details: "Quick-created from portfolio list",
  });

  revalidatePortfolioPaths(item.slug);
  scheduleContentSeoGeneration("portfolioItem", item.id);

  return {
    ok: true as const,
    item: serializePortfolioItem(item),
  };
}

export async function reorderPortfolioItems(orderedIds: string[]) {
  await requireEditorOrAdmin();
  const unique = Array.from(new Set(orderedIds)).slice(0, 500);
  if (unique.length === 0) return { ok: true as const };

  const existing = await prisma.portfolioItem.findMany({
    where: { id: { in: unique } },
    select: { id: true, slug: true },
  });
  const existingIds = new Set(existing.map((r) => r.id));
  const ids = unique.filter((id) => existingIds.has(id));

  if (ids.length === 0) return { ok: true as const };

  await prisma.$transaction(
    ids.map((id, sortOrder) =>
      prisma.portfolioItem.update({
        where: { id },
        data: { sortOrder },
      })
    )
  );

  await logActivity({
    entityType: "portfolioItem",
    entityId: ids[0] ?? "bulk",
    action: "reordered",
    title: "Portfolio order updated",
    details: `Reordered ${ids.length} portfolio items`,
  });

  revalidatePath("/");
  revalidatePath("/portfolio");

  return { ok: true as const, reordered: ids.length };
}

export async function updatePortfolioItem(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "";
  const summaryRaw = formData.get("summary")?.toString().trim();
  const contentRaw = formData.get("content")?.toString();
  const websiteUrlRaw = formData.get("websiteUrl")?.toString();
  const heroImageUrlRaw = formData.get("heroImageUrl")?.toString();
  const galleryUrlsRaw = formData.get("galleryUrls")?.toString();
  const detailsRaw = formData.get("details")?.toString();
  const sortOrderRaw = formData.get("sortOrder")?.toString();

  if (!id) return { ok: false as const, error: "Missing item id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  const current = await prisma.portfolioItem.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      status: true,
      summary: true,
      content: true,
      websiteUrl: true,
      heroImageUrl: true,
      galleryUrls: true,
      sortOrder: true,
      details: true,
    },
  });

  if (!current) return { ok: false as const, error: "Item not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const details: PortfolioDetailRow[] = parsePortfolioDetails(detailsRaw);

  const next = {
    title,
    slug,
    status: parseProjectStatus(statusRaw),
    summary: summaryRaw ? summaryRaw : null,
    content: parseOptionalText(contentRaw),
    websiteUrl: parseOptionalUrl(websiteUrlRaw),
    heroImageUrl: parseOptionalUrl(heroImageUrlRaw),
    galleryUrls: parseGalleryUrls(galleryUrlsRaw),
    sortOrder: parseSortOrder(sortOrderRaw),
    details,
  };

  const item = await prisma.portfolioItem.update({
    where: { id },
    data: next,
  });

  const currentDetails = normalizePortfolioDetails(current.details);
  const changedFields: string[] = [];
  if (current.title !== item.title) changedFields.push("title");
  if (current.slug !== item.slug) changedFields.push("slug");
  if (current.status !== item.status) changedFields.push("status");
  if ((current.summary ?? "") !== (item.summary ?? "")) changedFields.push("summary");
  if ((current.content ?? "") !== (item.content ?? "")) changedFields.push("content");
  if ((current.websiteUrl ?? "") !== (item.websiteUrl ?? "")) changedFields.push("websiteUrl");
  if ((current.heroImageUrl ?? "") !== (item.heroImageUrl ?? "")) changedFields.push("heroImageUrl");
  if (JSON.stringify(current.galleryUrls) !== JSON.stringify(item.galleryUrls)) {
    changedFields.push("galleryUrls");
  }
  if (current.sortOrder !== item.sortOrder) changedFields.push("sortOrder");
  if (JSON.stringify(currentDetails) !== JSON.stringify(normalizePortfolioDetails(item.details))) {
    changedFields.push("details");
  }

  await logActivity({
    entityType: "portfolioItem",
    entityId: item.id,
    action: "updated",
    title: item.title,
    details:
      changedFields.length > 0
        ? `Updated ${changedFields.join(", ")}`
        : "Updated from portfolio editor",
  });

  revalidatePortfolioPaths(item.slug, current.slug);
  scheduleContentSeoGeneration("portfolioItem", item.id);

  return {
    ok: true as const,
    item: serializePortfolioItem(item),
  };
}

export async function deletePortfolioItem(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing item id." };

  const existing = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { title: true, slug: true },
  });

  await prisma.portfolioItem.delete({ where: { id } });

  await logActivity({
    entityType: "portfolioItem",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted portfolio item",
    details: "Removed from portfolio list",
  });

  if (existing?.slug) revalidatePortfolioPaths(existing.slug);
  else {
    revalidatePath("/");
    revalidatePath("/portfolio");
  }
  return { ok: true as const };
}
