"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PropertyStatus = "draft" | "active" | "sold";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "property";
}

function parsePropertyStatus(raw: string | undefined | null): PropertyStatus {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "active") return "active";
  if (v === "sold") return "sold";
  return "draft";
}

export async function createPropertyQuick() {
  await requireEditorOrAdmin();
  const baseTitle = "Untitled Property";
  const baseSlug = slugify(baseTitle);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.property.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const property = await prisma.property.create({
    data: {
      title: baseTitle,
      slug: candidate,
      status: "draft",
      address: null,
      priceEur: null,
      bedrooms: null,
    },
  });

  await logActivity({
    entityType: "property",
    entityId: property.id,
    action: "created",
    title: property.title,
    details: "Quick-created from property list",
  });

  revalidatePath("/");
  revalidatePath("/immobilien");

  return {
    ok: true as const,
    property: {
      id: property.id,
      title: property.title,
      slug: property.slug,
      status: property.status,
      address: property.address,
      priceEur: property.priceEur,
      bedrooms: property.bedrooms,
      updatedAt: property.updatedAt.toISOString(),
      createdAt: property.createdAt.toISOString(),
    },
  };
}

export async function updateProperty(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "draft";
  const addressRaw = formData.get("address")?.toString().trim();
  const priceRaw = formData.get("priceEur")?.toString().trim() ?? "";
  const bedroomsRaw = formData.get("bedrooms")?.toString().trim() ?? "";

  if (!id) return { ok: false as const, error: "Missing property id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  const current = await prisma.property.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!current) return { ok: false as const, error: "Property not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.property.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const priceEur =
    priceRaw.length > 0 && !Number.isNaN(Number(priceRaw)) ? Math.round(Number(priceRaw)) : null;
  const bedrooms =
    bedroomsRaw.length > 0 && !Number.isNaN(Number(bedroomsRaw))
      ? Math.round(Number(bedroomsRaw))
      : null;

  const property = await prisma.property.update({
    where: { id },
    data: {
      title,
      slug,
      status: parsePropertyStatus(statusRaw),
      address: addressRaw ? addressRaw : null,
      priceEur,
      bedrooms,
    },
  });

  await logActivity({
    entityType: "property",
    entityId: property.id,
    action: "updated",
    title: property.title,
    details: "Updated from property editor",
  });

  revalidatePath("/");
  revalidatePath("/immobilien");

  return {
    ok: true as const,
    property: {
      id: property.id,
      title: property.title,
      slug: property.slug,
      status: property.status,
      address: property.address,
      priceEur: property.priceEur,
      bedrooms: property.bedrooms,
      updatedAt: property.updatedAt.toISOString(),
      createdAt: property.createdAt.toISOString(),
    },
  };
}

export async function deleteProperty(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing property id." };

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { title: true },
  });

  await prisma.property.delete({ where: { id } });

  await logActivity({
    entityType: "property",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted property",
    details: "Removed from property list",
  });

  revalidatePath("/");
  revalidatePath("/immobilien");
  return { ok: true as const };
}

