import { MediaBrowserFinderClient } from "./media-browser-finder-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [media, folders] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.mediaFolder.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = media.map((item) => ({
    id: item.id,
    filename: item.filename,
    originalName: item.originalName,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    url: item.url,
    title: item.title,
    altText: item.altText,
    tags: item.tags,
    folderId: item.folderId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const serializedFolders = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }));

  return <MediaBrowserFinderClient initialMedia={serialized} initialFolders={serializedFolders} />;
}
