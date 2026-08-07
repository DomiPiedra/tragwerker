"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { ProjectStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

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

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "project";
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

function authorFromUser(user: { displayName: string; username: string }): string {
  const displayName = user.displayName.trim();
  return displayName || user.username;
}

function serializeProject(project: {
  id: string;
  name: string;
  slug: string;
  author: string;
  category: string;
  status: ProjectStatus;
  description: string | null;
  content: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    author: project.author,
    category: project.category,
    status: project.status,
    description: project.description,
    content: project.content,
    heroImageUrl: project.heroImageUrl,
    galleryUrls: project.galleryUrls,
    updatedAt: project.updatedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
  };
}

export async function createProject(formData: FormData) {
  const user = await requireEditorOrAdmin();
  const name = formData.get("name")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const authorRaw = formData.get("author")?.toString().trim() ?? "";
  const categoryRaw = formData.get("category")?.toString().trim() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "";
  const descriptionRaw = formData.get("description")?.toString().trim();
  const contentRaw = formData.get("content")?.toString();
  const heroImageUrlRaw = formData.get("heroImageUrl")?.toString();
  const galleryUrlsRaw = formData.get("galleryUrls")?.toString();

  if (!name) {
    return { ok: false as const, error: "Name is required." };
  }

  const slug = slugRaw ? slugify(slugRaw) : slugify(name);

  let candidate = slug;
  for (let n = 0; n < 100; n++) {
    const existing = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${slug}-${n + 2}`;
  }

  const created = await prisma.project.create({
    data: {
      name,
      slug: candidate,
      author: authorRaw || authorFromUser(user),
      category: categoryRaw || "Residential",
      status: parseProjectStatus(statusRaw),
      description: descriptionRaw ? descriptionRaw : null,
      content: parseOptionalText(contentRaw),
      heroImageUrl: parseOptionalUrl(heroImageUrlRaw),
      galleryUrls: parseGalleryUrls(galleryUrlsRaw),
    },
  });

  await logActivity({
    entityType: "project",
    entityId: created.id,
    action: "created",
    title: created.name,
    details: `Created by ${created.author} in ${created.category} (${created.status})`,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  scheduleContentSeoGeneration("project", created.id);
  return { ok: true as const };
}

export async function createProjectForm(formData: FormData) {
  await requireEditorOrAdmin();
  const result = await createProject(formData);
  if (!result.ok) {
    redirect(`/projects?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/projects");
}

export async function updateProject(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const authorRaw = formData.get("author")?.toString().trim() ?? "";
  const categoryRaw = formData.get("category")?.toString().trim() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "";
  const descriptionRaw = formData.get("description")?.toString().trim();
  const contentRaw = formData.get("content")?.toString();
  const heroImageUrlRaw = formData.get("heroImageUrl")?.toString();
  const galleryUrlsRaw = formData.get("galleryUrls")?.toString();

  if (!id) return { ok: false as const, error: "Missing project id." };
  if (!name) return { ok: false as const, error: "Name is required." };

  let supportsCategory = true;
  let supportsStatus = true;
  let current: {
    slug: string;
    name: string;
    author: string;
    description: string | null;
    content?: string | null;
    heroImageUrl?: string | null;
    galleryUrls?: string[];
    category?: string;
    status?: ProjectStatus;
  } | null = null;

  for (;;) {
    try {
      current = await prisma.project.findUnique({
        where: { id },
        select: {
          slug: true,
          name: true,
          author: true,
          description: true,
          content: true,
          heroImageUrl: true,
          galleryUrls: true,
          ...(supportsCategory ? { category: true } : {}),
          ...(supportsStatus ? { status: true } : {}),
        },
      });
      break;
    } catch (error) {
      const loseCat = isPrismaUnknownFieldError(error, "category");
      const loseStat = isPrismaUnknownFieldError(error, "status");
      if (!loseCat && !loseStat) throw error;
      if (loseCat) supportsCategory = false;
      if (loseStat) supportsStatus = false;
    }
  }
  if (!current) return { ok: false as const, error: "Project not found." };

  // Keep current slug unless user explicitly edits it.
  const slug = slugRaw ? slugify(slugRaw) : current.slug;

  if (slug !== current.slug) {
    const existing = await prisma.project.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) {
      return { ok: false as const, error: "Slug already exists." };
    }
  }

  let project;
  try {
    const updateData: {
      name: string;
      slug: string;
      author: string;
      description: string | null;
      content: string | null;
      heroImageUrl: string | null;
      galleryUrls: string[];
      category?: string;
      status?: ProjectStatus;
    } = {
      name,
      slug,
      author: authorRaw || current.author,
      description: descriptionRaw ? descriptionRaw : null,
      content: parseOptionalText(contentRaw),
      heroImageUrl: parseOptionalUrl(heroImageUrlRaw),
      galleryUrls: parseGalleryUrls(galleryUrlsRaw),
    };
    if (supportsCategory) {
      updateData.category = categoryRaw || "Residential";
    }
    if (supportsStatus) {
      updateData.status = parseProjectStatus(statusRaw);
    }

    project = await prisma.project.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false as const, error: "Slug already exists." };
    }
    return { ok: false as const, error: "Failed to update project." };
  }

  const changedFields: string[] = [];
  if (current.name !== project.name) changedFields.push("name");
  if (current.slug !== project.slug) changedFields.push("slug");
  if (current.author !== project.author) changedFields.push("author");
  if (
    supportsCategory &&
    current.category !== undefined &&
    current.category !== project.category
  ) {
    changedFields.push("category");
  }
  if (
    supportsStatus &&
    current.status !== undefined &&
    current.status !== project.status
  ) {
    changedFields.push("status");
  }
  if ((current.description ?? "") !== (project.description ?? "")) {
    changedFields.push("description");
  }
  if ((current.content ?? "") !== (project.content ?? "")) {
    changedFields.push("content");
  }
  if ((current.heroImageUrl ?? "") !== (project.heroImageUrl ?? "")) {
    changedFields.push("heroImageUrl");
  }
  if (JSON.stringify(current.galleryUrls ?? []) !== JSON.stringify(project.galleryUrls ?? [])) {
    changedFields.push("galleryUrls");
  }

  await logActivity({
    entityType: "project",
    entityId: project.id,
    action: "updated",
    title: project.name,
    details:
      changedFields.length > 0
        ? `Updated ${changedFields.join(", ")}`
        : "No field changes detected",
  });

  revalidatePath("/");
  revalidatePath("/projects");

  scheduleContentSeoGeneration("project", project.id);

  return {
    ok: true as const,
    project: serializeProject(project),
  };
}

export async function createProjectQuick() {
  const user = await requireEditorOrAdmin();
  const baseName = "Untitled Project";
  const baseSlug = slugify(baseName);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const project = await prisma.project.create({
    data: {
      name: baseName,
      slug: candidate,
      author: authorFromUser(user),
      category: "Residential",
      status: ProjectStatus.Draft,
      description: null,
    },
  });

  await logActivity({
    entityType: "project",
    entityId: project.id,
    action: "created",
    title: project.name,
    details: `Quick-created by ${project.author} in ${project.category} (${project.status})`,
  });

  revalidatePath("/");
  revalidatePath("/projects");

  scheduleContentSeoGeneration("project", project.id);

  return {
    ok: true as const,
    project: serializeProject(project),
  };
}

export async function deleteProject(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing project id." };

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });

  await prisma.project.delete({ where: { id } });

  await logActivity({
    entityType: "project",
    entityId: id,
    action: "deleted",
    title: existing?.name ?? "Deleted project",
    details: "Project removed from list",
  });

  revalidatePath("/");
  revalidatePath("/projects");
  return { ok: true as const };
}
