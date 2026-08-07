"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "event";
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

function serializeEvent(event: {
  id: string;
  title: string;
  slug: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  description: string | null;
  content: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  published: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    location: event.location,
    description: event.description,
    content: event.content,
    heroImageUrl: event.heroImageUrl,
    galleryUrls: event.galleryUrls,
    published: event.published,
    publishedAt: event.publishedAt ? event.publishedAt.toISOString() : null,
    updatedAt: event.updatedAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
  };
}

export async function createEventQuick() {
  await requireEditorOrAdmin();
  const baseTitle = "Untitled Event";
  const baseSlug = slugify(baseTitle);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const now = new Date();
  const event = await prisma.event.create({
    data: {
      title: baseTitle,
      slug: candidate,
      startsAt: now,
      endsAt: null,
      location: null,
      description: null,
      content: null,
      heroImageUrl: null,
      galleryUrls: [],
      published: false,
      publishedAt: null,
    },
  });

  await logActivity({
    entityType: "event",
    entityId: event.id,
    action: "created",
    title: event.title,
    details: "Quick-created from events list",
  });

  revalidatePath("/");
  revalidatePath("/events");
  scheduleContentSeoGeneration("event", event.id);

  return { ok: true as const, event: serializeEvent(event) };
}

export async function updateEvent(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const startsAtRaw = formData.get("startsAt")?.toString() ?? "";
  const endsAtRaw = formData.get("endsAt")?.toString() ?? "";
  const locationRaw = formData.get("location")?.toString().trim();
  const descriptionRaw = formData.get("description")?.toString().trim();
  const contentRaw = formData.get("content")?.toString();
  const heroImageUrlRaw = formData.get("heroImageUrl")?.toString();
  const galleryUrlsRaw = formData.get("galleryUrls")?.toString();
  const publishedRaw = formData.get("published")?.toString() ?? "false";
  const publishedAtRaw = formData.get("publishedAt")?.toString() ?? "";

  if (!id) return { ok: false as const, error: "Missing event id." };
  if (!title) return { ok: false as const, error: "Title is required." };
  if (!startsAtRaw) return { ok: false as const, error: "Start date is required." };

  const current = await prisma.event.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!current) return { ok: false as const, error: "Event not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.event.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false as const, error: "Invalid start date." };
  }

  let endsAt: Date | null = null;
  if (endsAtRaw.trim().length > 0) {
    const parsed = new Date(endsAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false as const, error: "Invalid end date." };
    }
    endsAt = parsed;
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

  const event = await prisma.event.update({
    where: { id },
    data: {
      title,
      slug,
      startsAt,
      endsAt,
      location: locationRaw ? locationRaw : null,
      description: descriptionRaw ? descriptionRaw : null,
      content: parseOptionalText(contentRaw),
      heroImageUrl: parseOptionalUrl(heroImageUrlRaw),
      galleryUrls: parseGalleryUrls(galleryUrlsRaw),
      published,
      publishedAt: published ? publishedAt ?? new Date() : null,
    },
  });

  await logActivity({
    entityType: "event",
    entityId: event.id,
    action: "updated",
    title: event.title,
    details: "Updated from events editor",
  });

  revalidatePath("/");
  revalidatePath("/events");
  scheduleContentSeoGeneration("event", event.id);

  return { ok: true as const, event: serializeEvent(event) };
}

export async function deleteEvent(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing event id." };

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { title: true },
  });

  await prisma.event.delete({ where: { id } });

  await logActivity({
    entityType: "event",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted event",
    details: "Removed from events list",
  });

  revalidatePath("/");
  revalidatePath("/events");
  return { ok: true as const };
}
