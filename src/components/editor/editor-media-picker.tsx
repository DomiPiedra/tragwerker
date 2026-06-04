"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImageIcon, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type EditorMediaPickerProps = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditorMediaPicker({ editor, open, onOpenChange }: EditorMediaPickerProps) {
  const [items, setItems] = useState<MediaPickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setUrlDraft("");
      return;
    }
    setLoading(true);
    setError(null);
    void fetch("/api/media/assets")
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

  const insertImage = useCallback(
    (src: string, alt?: string | null) => {
      if (!editor || !src.trim()) return;
      editor.chain().focus().setImage({ src: src.trim(), alt: alt?.trim() || undefined }).run();
      onOpenChange(false);
    },
    [editor, onOpenChange]
  );

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        items?: Array<{ url: string; altText: string | null; title: string }>;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.items?.[0]?.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      const row = data.items[0];
      insertImage(row.url, row.altText ?? row.title);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submitUrl() {
    const u = urlDraft.trim();
    if (!u) return;
    insertImage(u);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 opacity-70" />
            Insert image
          </SheetTitle>
          <SheetDescription>
            Upload a file or choose from your media library. You can also paste a URL below.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
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
              Upload image
            </Button>
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
              Library
            </p>
            <div className="max-h-[min(52vh,420px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">No images in the library yet. Upload one above.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!editor}
                      title={item.title}
                      className={cn(
                        "border-border bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring relative aspect-square overflow-hidden rounded-md border transition-colors",
                        "focus-visible:ring-2 focus-visible:outline-none"
                      )}
                      onClick={() => insertImage(item.url, item.altText ?? item.title)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-border shrink-0 space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">Image URL</p>
            <div className="flex gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitUrl();
                  }
                }}
              />
              <Button type="button" size="sm" variant="secondary" disabled={!editor} onClick={submitUrl}>
                Insert
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
