"use server";

import { revalidatePath } from "next/cache";

import type { EmploymentType, RemoteType } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { serializeJob } from "@/lib/jobs/serialize";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "job";
}

function parseEmploymentType(raw: string | null | undefined): EmploymentType | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const allowed: EmploymentType[] = [
    "FullTime",
    "PartTime",
    "Freelance",
    "Internship",
    "WorkingStudent",
    "Contract",
  ];
  return allowed.includes(v as EmploymentType) ? (v as EmploymentType) : null;
}

function parseRemoteType(raw: string | null | undefined): RemoteType | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const allowed: RemoteType[] = ["OnSite", "Hybrid", "Remote"];
  return allowed.includes(v as RemoteType) ? (v as RemoteType) : null;
}

function parseOptionalString(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  return v ? v : null;
}

export async function createJobQuick() {
  const user = await requireEditorOrAdmin();
  const baseTitle = "Untitled Job";
  const baseSlug = slugify(baseTitle);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.job.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const job = await prisma.job.create({
    data: {
      title: baseTitle,
      slug: candidate,
      authorId: user.id,
      published: false,
      publishedAt: null,
    },
  });

  await logActivity({
    entityType: "job",
    entityId: job.id,
    action: "created",
    title: job.title,
    details: "Quick-created from jobs list",
  });

  revalidatePath("/");
  revalidatePath("/jobs");

  scheduleContentSeoGeneration("job", job.id);

  return { ok: true as const, job: serializeJob(job) };
}

export async function updateJob(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const positionRaw = formData.get("position")?.toString();
  const departmentRaw = formData.get("department")?.toString();
  const locationRaw = formData.get("location")?.toString();
  const employmentTypeRaw = formData.get("employmentType")?.toString();
  const remoteTypeRaw = formData.get("remoteType")?.toString();
  const salaryRaw = formData.get("salary")?.toString();
  const applicationEmailRaw = formData.get("applicationEmail")?.toString();
  const applicationUrlRaw = formData.get("applicationUrl")?.toString();
  const shortDescriptionRaw = formData.get("shortDescription")?.toString();
  const contentRaw = formData.get("content")?.toString();
  const requirementsRaw = formData.get("requirements")?.toString();
  const benefitsRaw = formData.get("benefits")?.toString();
  const responsibilitiesRaw = formData.get("responsibilities")?.toString();
  const featuredRaw = formData.get("featured")?.toString() ?? "false";
  const publishedRaw = formData.get("published")?.toString() ?? "false";
  const publishedAtRaw = formData.get("publishedAt")?.toString() ?? "";

  if (!id) return { ok: false as const, error: "Missing job id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  const current = await prisma.job.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!current) return { ok: false as const, error: "Job not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.job.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const published = publishedRaw === "true";
  let publishedAt: Date | null = null;
  if (publishedAtRaw.trim().length > 0) {
    const parsed = new Date(publishedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false as const, error: "Invalid published date." };
    }
    publishedAt = parsed;
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      title,
      slug,
      position: parseOptionalString(positionRaw),
      department: parseOptionalString(departmentRaw),
      location: parseOptionalString(locationRaw),
      employmentType: parseEmploymentType(employmentTypeRaw),
      remoteType: parseRemoteType(remoteTypeRaw),
      salary: parseOptionalString(salaryRaw),
      applicationEmail: parseOptionalString(applicationEmailRaw),
      applicationUrl: parseOptionalString(applicationUrlRaw),
      shortDescription: parseOptionalString(shortDescriptionRaw),
      content: parseOptionalString(contentRaw),
      requirements: parseOptionalString(requirementsRaw),
      benefits: parseOptionalString(benefitsRaw),
      responsibilities: parseOptionalString(responsibilitiesRaw),
      featured: featuredRaw === "true",
      published,
      publishedAt: published ? publishedAt ?? new Date() : null,
    },
  });

  await logActivity({
    entityType: "job",
    entityId: job.id,
    action: "updated",
    title: job.title,
    details: "Updated from jobs editor",
  });

  revalidatePath("/");
  revalidatePath("/jobs");

  scheduleContentSeoGeneration("job", job.id);

  return { ok: true as const, job: serializeJob(job) };
}

export async function deleteJob(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing job id." };

  const existing = await prisma.job.findUnique({
    where: { id },
    select: { title: true },
  });

  await prisma.job.delete({ where: { id } });

  await logActivity({
    entityType: "job",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted job",
    details: "Removed from jobs list",
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  return { ok: true as const };
}

export async function deleteJobsBulk(ids: string[]) {
  await requireEditorOrAdmin();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { ok: false as const, error: "No jobs selected." };
  }

  const rows = await prisma.job.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, title: true },
  });

  await prisma.job.deleteMany({ where: { id: { in: uniqueIds } } });

  for (const row of rows) {
    await logActivity({
      entityType: "job",
      entityId: row.id,
      action: "deleted",
      title: row.title,
      details: "Bulk deleted from jobs list",
    });
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  return { ok: true as const, deletedCount: rows.length };
}

export async function publishJobsBulk(ids: string[], published: boolean) {
  await requireEditorOrAdmin();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { ok: false as const, error: "No jobs selected." };
  }

  const now = new Date();
  await prisma.job.updateMany({
    where: { id: { in: uniqueIds } },
    data: {
      published,
      publishedAt: published ? now : null,
    },
  });

  const rows = await prisma.job.findMany({
    where: { id: { in: uniqueIds } },
  });

  for (const row of rows) {
    await logActivity({
      entityType: "job",
      entityId: row.id,
      action: published ? "published" : "unpublished",
      title: row.title,
      details: published ? "Bulk published from jobs list" : "Bulk unpublished from jobs list",
    });
    scheduleContentSeoGeneration("job", row.id);
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  return { ok: true as const, jobs: rows.map(serializeJob) };
}
