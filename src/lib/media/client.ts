import { COMMAND_BAR_MEDIA_TAG } from "@/lib/media/constants";
import type { CommandAttachment } from "@/types/command-attachment";

export type UploadedMediaItem = {
  id: string;
  url: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export function toCommandAttachment(item: UploadedMediaItem): CommandAttachment {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    originalName: item.originalName,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
  };
}

export async function uploadMediaFiles(
  files: File[],
  options?: { tags?: string[] }
): Promise<{ ok: true; items: UploadedMediaItem[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: "No files selected." };

  const tags = Array.from(
    new Set([COMMAND_BAR_MEDIA_TAG, ...(options?.tags ?? [])].map((t) => t.trim()).filter(Boolean))
  );

  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  if (tags.length > 0) formData.append("tags", tags.join(", "));

  const response = await fetch("/api/media/upload", { method: "POST", body: formData });
  const data = (await response.json()) as {
    ok?: boolean;
    items?: UploadedMediaItem[];
    error?: string;
  };

  if (!response.ok || !data.ok || !data.items?.length) {
    return { ok: false, error: data.error ?? "Upload failed." };
  }

  return { ok: true, items: data.items };
}

export async function fetchMediaLibraryForPicker(): Promise<UploadedMediaItem[]> {
  const response = await fetch("/api/media/assets?scope=all");
  if (!response.ok) throw new Error("Could not load media library.");
  const data = (await response.json()) as { items?: UploadedMediaItem[] };
  return data.items ?? [];
}
