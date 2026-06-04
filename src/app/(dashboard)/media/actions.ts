"use server";

import { revalidatePath } from "next/cache";

import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateMediaAsset(formData: FormData) {
  await requireEditorOrAdmin();

  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const altTextRaw = formData.get("altText")?.toString().trim() ?? "";
  const tagsRaw = formData.get("tags")?.toString().trim() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!id) return { ok: false as const, error: "Missing media id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  const media = await prisma.mediaAsset.update({
    where: { id },
    data: {
      title,
      altText: altTextRaw || null,
      tags,
    },
  });

  revalidatePath("/media");
  return {
    ok: true as const,
    item: {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      url: media.url,
      title: media.title,
      altText: media.altText,
      tags: media.tags,
      folderId: media.folderId,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    },
  };
}

export async function deleteMediaAssets(ids: string[]) {
  await requireEditorOrAdmin();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return { ok: false as const, error: "No items selected." };

  await prisma.mediaAsset.deleteMany({
    where: {
      id: { in: uniqueIds },
    },
  });

  revalidatePath("/media");
  return { ok: true as const };
}

export async function createMediaFolder(nameRaw: string, parentId: string | null = null) {
  await requireEditorOrAdmin();

  const name = nameRaw.trim();
  if (!name) return { ok: false as const, error: "Folder name is required." };

  try {
    const folder = await prisma.mediaFolder.create({
      data: { name, parentId },
    });
    revalidatePath("/media");
    return {
      ok: true as const,
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
    };
  } catch {
    return { ok: false as const, error: "Folder already exists or could not be created." };
  }
}

export async function moveMediaToFolder(ids: string[], folderId: string | null) {
  await requireEditorOrAdmin();

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return { ok: false as const, error: "No items selected." };

  await prisma.mediaAsset.updateMany({
    where: {
      id: { in: uniqueIds },
    },
    data: {
      folderId,
    },
  });

  revalidatePath("/media");
  return { ok: true as const };
}

export async function renameMediaFolder(id: string, nameRaw: string) {
  await requireEditorOrAdmin();

  const name = nameRaw.trim();
  if (!id) return { ok: false as const, error: "Missing folder id." };
  if (!name) return { ok: false as const, error: "Folder name is required." };

  try {
    const folder = await prisma.mediaFolder.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/media");
    return {
      ok: true as const,
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
    };
  } catch {
    return { ok: false as const, error: "Could not rename folder (duplicate name in this location?)." };
  }
}

export async function deleteMediaFolder(id: string) {
  await requireEditorOrAdmin();

  if (!id) return { ok: false as const, error: "Missing folder id." };

  const folder = await prisma.mediaFolder.findUnique({ where: { id } });
  if (!folder) return { ok: false as const, error: "Folder not found." };

  const parentId = folder.parentId;

  await prisma.$transaction([
    prisma.mediaFolder.updateMany({
      where: { parentId: id },
      data: { parentId },
    }),
    prisma.mediaAsset.updateMany({
      where: { folderId: id },
      data: { folderId: parentId },
    }),
    prisma.mediaFolder.delete({ where: { id } }),
  ]);

  revalidatePath("/media");
  return { ok: true as const };
}
