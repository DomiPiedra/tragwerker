"use client";

import { FileIcon, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { isImageAttachment, type CommandAttachment } from "@/types/command-attachment";

function bytesLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommandAttachmentChips({
  attachments,
  uploading,
  onRemove,
  className,
}: {
  attachments: CommandAttachment[];
  uploading?: boolean;
  onRemove: (id: string) => void;
  className?: string;
}) {
  if (attachments.length === 0 && !uploading) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {uploading ? (
        <span className="border-border bg-muted/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
          Uploading…
        </span>
      ) : null}
      {attachments.map((file) => {
        const isImage = isImageAttachment(file.mimeType);
        return (
          <div
            key={file.id}
            className="border-border bg-muted/30 group relative flex max-w-[200px] items-center gap-2 rounded-lg border py-1 pr-1 pl-1"
            title={`${file.title} (${bytesLabel(file.sizeBytes)})`}
          >
            {isImage ? (
              <div className="size-9 shrink-0 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt="" className="size-full object-cover" />
              </div>
            ) : (
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <FileIcon className="text-muted-foreground size-4" />
              </div>
            )}
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{file.title}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity group-hover:opacity-100"
              aria-label={`Remove ${file.title}`}
              onClick={() => onRemove(file.id)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
