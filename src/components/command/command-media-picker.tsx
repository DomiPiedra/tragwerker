"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileIcon, Loader2, Paperclip, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchMediaLibraryForPicker, toCommandAttachment, uploadMediaFiles } from "@/lib/media/client";
import { cn } from "@/lib/utils";
import { isImageAttachment, type CommandAttachment } from "@/types/command-attachment";

type LibraryRow = {
  id: string;
  url: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

type CommandMediaPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onAdd: (items: CommandAttachment[]) => void;
};

export function CommandMediaPicker({
  open,
  onOpenChange,
  selectedIds,
  onAdd,
}: CommandMediaPickerProps) {
  const [items, setItems] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMediaLibraryForPicker();
      setItems(rows);
    } catch {
      setItems([]);
      setError("Could not load media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setPicked(new Set());
      setError(null);
      return;
    }
    void loadLibrary();
  }, [loadLibrary, open]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadMediaFiles(Array.from(fileList));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const added = result.items.map(toCommandAttachment);
      onAdd(added);
      await loadLibrary();
      onOpenChange(false);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmSelection() {
    const chosen = items.filter((item) => picked.has(item.id));
    if (chosen.length === 0) return;
    onAdd(chosen.map(toCommandAttachment));
    onOpenChange(false);
  }

  const alreadyAttached = new Set(selectedIds);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Paperclip className="size-4 opacity-70" />
            Attach files
          </SheetTitle>
          <SheetDescription>
            Upload new files or pick from your media library. Files appear in Media and stay attached
            to your command.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={uploading}
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload files
            </Button>
            {picked.size > 0 ? (
              <Button type="button" size="sm" variant="secondary" onClick={confirmSelection}>
                Add {picked.size} selected
              </Button>
            ) : null}
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
              Media library
            </p>
            <div className="max-h-[min(52vh,420px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">No files yet. Upload one above.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item) => {
                    const isImage = isImageAttachment(item.mimeType);
                    const isSelected = picked.has(item.id);
                    const isAttached = alreadyAttached.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isAttached}
                        title={
                          isAttached
                            ? `${item.title} (already attached)`
                            : `${item.title} — click to select`
                        }
                        className={cn(
                          "border-border bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring relative aspect-square overflow-hidden rounded-md border transition-colors",
                          "focus-visible:ring-2 focus-visible:outline-none",
                          isSelected && "ring-foreground ring-2",
                          isAttached && "cursor-not-allowed opacity-45"
                        )}
                        onClick={() => {
                          if (isAttached) return;
                          togglePick(item.id);
                        }}
                      >
                        {isImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.url} alt="" className="size-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center gap-1 p-2">
                            <FileIcon className="text-muted-foreground size-6" />
                            <span className="line-clamp-2 text-center text-[10px] leading-tight font-medium">
                              {item.title}
                            </span>
                          </div>
                        )}
                        {isSelected ? (
                          <span className="bg-foreground text-background absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
