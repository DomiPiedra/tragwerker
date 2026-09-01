"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { FileVideo, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MediaPickerRow = {
  id: string;
  url: string;
  title: string;
  altText: string | null;
  mimeType: string;
};

type EditorVideoPickerProps = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditorVideoPicker({ editor, open, onOpenChange }: EditorVideoPickerProps) {
  const [items, setItems] = useState<MediaPickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    void fetch("/api/media/assets?scope=videos")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load media library.");
        const data = (await res.json()) as { items?: MediaPickerRow[] };
        setItems(data.items ?? []);
      })
      .catch(() => {
        setItems([]);
        setError("Could not load media library.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const insertLocalVideo = useCallback(
    (src: string, title?: string | null) => {
      if (!editor || !src.trim()) return;
      editor
        .chain()
        .focus()
        .setEditorVideo({ src: src.trim(), title: title?.trim() || null })
        .run();
      onOpenChange(false);
    },
    [editor, onOpenChange]
  );

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const isVideo =
      file.type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(file.name);
    if (!isVideo) {
      setError("Please choose a video file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        items?: Array<{ url: string; altText: string | null; title: string; mimeType?: string }>;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.items?.[0]?.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      const row = data.items[0];
      insertLocalVideo(row.url, row.altText ?? row.title);
      setItems((prev) => [
        {
          id: row.url,
          url: row.url,
          title: row.title,
          altText: row.altText,
          mimeType: row.mimeType ?? file.type,
        },
        ...prev,
      ]);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <FileVideo className="size-4 opacity-70" />
            Insert video
          </SheetTitle>
          <SheetDescription>
            Upload a video to your server or pick one from the media library. For YouTube, use / → YouTube in the editor.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="video/*,.mp4,.webm,.ogg,.mov,.m4v"
              className="hidden"
              onChange={(e) => void handleUpload(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={uploading || !editor}
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload video
            </Button>
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
              Video library
            </p>
            <div className="max-h-[min(52vh,420px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">
                  No videos in the library yet. Upload one above.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!editor}
                      title={item.title}
                      className={cn(
                        "border-border bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring relative aspect-video overflow-hidden rounded-md border transition-colors",
                        "focus-visible:ring-2 focus-visible:outline-none"
                      )}
                      onClick={() => insertLocalVideo(item.url, item.altText ?? item.title)}
                    >
                      <video
                        src={item.url}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-2">
                        <span className="truncate text-left text-[11px] text-white">{item.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
