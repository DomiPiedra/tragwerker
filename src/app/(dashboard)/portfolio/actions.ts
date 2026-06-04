"use server";

import { revalidatePath } from "next/cache";

import { ProjectStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

function isPrismaUnknownFieldError(error: unknown, field: string): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message;
  return (
    m.includes(`Unknown field \`${field}\``) ||
    m.includes(`Unknown argument \`${field}\``) ||
    m.includes(`Unknown field '${field}'`) ||
    m.includes(`Unknown argument '${field}'`)
  );
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

  let supportsStatus = true;
  let item:
    | {
        id: string;
        title: string;
        slug: string;
        status?: ProjectStatus;
        summary: string | null;
        websiteUrl: string | null;
        updatedAt: Date;
        createdAt: Date;
      }
    | undefined;
  try {
    item = await prisma.portfolioItem.create({
      data: {
        title: baseTitle,
        slug: candidate,
        status: ProjectStatus.Draft,
        summary: null,
        websiteUrl: null,
      },
    });
  } catch (error) {
    if (!isPrismaUnknownFieldError(error, "status")) throw error;
    supportsStatus = false;
    item = await prisma.portfolioItem.create({
      data: {
        title: baseTitle,
        slug: candidate,
        summary: null,
        websiteUrl: null,
      },
    });
  }

  await logActivity({
    entityType: "portfolioItem",
    entityId: item.id,
    action: "created",
    title: item.title,
    details: "Quick-created from portfolio list",
  });

  revalidatePath("/");
  revalidatePath("/portfolio");

  return {
    ok: true as const,
    item: {
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status ?? (supportsStatus ? ProjectStatus.Draft : ProjectStatus.Draft),
      summary: item.summary,
      websiteUrl: item.websiteUrl,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    },
  };
}

export async function updatePortfolioItem(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "";
  const summaryRaw = formData.get("summary")?.toString().trim();
  const websiteUrlRaw = formData.get("websiteUrl")?.toString().trim();

  if (!id) return { ok: false as const, error: "Missing item id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  let supportsStatus = true;
  let current:
    | {
        title: string;
        slug: string;
        status?: ProjectStatus;
        summary: string | null;
        websiteUrl: string | null;
      }
    | null = null;
  for (;;) {
    try {
      current = await prisma.portfolioItem.findUnique({
        where: { id },
        select: {
          title: true,
          slug: true,
          summary: true,
          websiteUrl: true,
          ...(supportsStatus ? { status: true } : {}),
        },
      });
      break;
    } catch (error) {
      if (!isPrismaUnknownFieldError(error, "status")) throw error;
      supportsStatus = false;
    }
  }

  if (!current) return { ok: false as const, error: "Item not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const item = await prisma.portfolioItem.update({
    where: { id },
    data: {
      title,
      slug,
      ...(supportsStatus ? { status: parseProjectStatus(statusRaw) } : {}),
      summary: summaryRaw ? summaryRaw : null,
      websiteUrl: websiteUrlRaw ? websiteUrlRaw : null,
    },
  });

  await logActivity({
    entityType: "portfolioItem",
    entityId: item.id,
    action: "updated",
    title: item.title,
    details: "Updated from portfolio editor",
  });

  revalidatePath("/");
  revalidatePath("/portfolio");

  return {
    ok: true as const,
    item: {
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status ?? current.status ?? ProjectStatus.Draft,
      summary: item.summary,
      websiteUrl: item.websiteUrl,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    },
  };
}

export async function deletePortfolioItem(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing item id." };

  const existing = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { title: true },
  });

  await prisma.portfolioItem.delete({ where: { id } });

  await logActivity({
    entityType: "portfolioItem",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted portfolio item",
    details: "Removed from portfolio list",
  });

  revalidatePath("/");
  revalidatePath("/portfolio");
  return { ok: true as const };
}

