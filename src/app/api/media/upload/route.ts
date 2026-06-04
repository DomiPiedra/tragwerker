import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  await requireEditorOrAdmin();

  const formData = await request.formData();
  const files = formData.getAll("files");
  const titleRaw = formData.get("title")?.toString().trim();
  const altTextRaw = formData.get("altText")?.toString().trim();
  const tagsRaw = formData.get("tags")?.toString().trim() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const folderIdRaw = formData.get("folderId")?.toString().trim() ?? "";
  const folderId = folderIdRaw.length > 0 ? folderIdRaw : null;

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files uploaded." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
  await mkdir(uploadDir, { recursive: true });

  const created: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    title: string;
    altText: string | null;
    tags: string[];
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
  }> = [];

  for (const entry of files) {
    if (!(entry instanceof File)) continue;
    const originalName = entry.name || "file";
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const storedFileName = `${normalizeFileName(baseName)}-${randomUUID().slice(0, 8)}${extension.toLowerCase()}`;
    const destination = path.join(uploadDir, storedFileName);
    const buffer = Buffer.from(await entry.arrayBuffer());
    await writeFile(destination, buffer);

    const media = await prisma.mediaAsset.create({
      data: {
        filename: storedFileName,
        originalName,
        mimeType: entry.type || "application/octet-stream",
        sizeBytes: entry.size,
        url: `/uploads/media/${storedFileName}`,
        title: titleRaw && files.length === 1 ? titleRaw : baseName || originalName,
        altText: altTextRaw || null,
        tags,
        folderId,
      },
    });

    created.push({
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
    });
  }

  return NextResponse.json({ ok: true, items: created });
}
