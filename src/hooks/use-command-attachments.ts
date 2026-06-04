"use client";

import { useCallback, useState } from "react";

import { toCommandAttachment, uploadMediaFiles } from "@/lib/media/client";
import type { CommandAttachment } from "@/types/command-attachment";

export function useCommandAttachments() {
  const [attachments, setAttachments] = useState<CommandAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAttachments = useCallback((items: CommandAttachment[]) => {
    if (items.length === 0) return;
    setAttachments((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      const next = [...prev];
      for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        next.push(item);
      }
      return next;
    });
    setError(null);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setError(null);
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      setError(null);
      try {
        const result = await uploadMediaFiles(files);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        addAttachments(result.items.map(toCommandAttachment));
      } catch {
        setError("Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [addAttachments]
  );

  return {
    attachments,
    hasAttachments: attachments.length > 0,
    uploading,
    error,
    setError,
    addAttachments,
    removeAttachment,
    clearAttachments,
    uploadFiles,
  };
}
