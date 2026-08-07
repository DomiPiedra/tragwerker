"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchMediaLibraryForPicker, uploadMediaFiles } from "@/lib/media/client";
import { cn } from "@/lib/utils";

type MediaImagePickerProps = {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  fallbackLabel?: string;
  variant?: "avatar" | "cover" | "banner";
  disabled?: boolean;
  className?: string;
};

export function MediaImagePicker({
  value,
  onChange,
  placeholder = "Choose from media",
  fallbackLabel = "?",
  variant = "avatar",
  disabled = false,
  className,
}: MediaImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<
    Array<{
      id: string;
      url: string;
      title: string;
      altText?: string | null;
      mimeType: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMediaLibraryForPicker();
      setItems(
        rows.filter(
          (item) =>
            item.mimeType.startsWith("image/") ||
            /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i.test(item.originalName)
        )
      );
    } catch {
      setItems([]);
      setError("Could not load media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setUrlDraft("");
      return;
    }
    void loadLibrary();
  }, [loadLibrary, open]);

  function selectImage(url: string) {
    const next = url.trim();
    if (!next) return;
    onChange(next);
    setOpen(false);
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadMediaFiles([file]);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      selectImage(result.items[0].url);
      await loadLibrary();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submitUrl() {
    selectImage(urlDraft);
  }

  const changeLabel = value ? "Change" : placeholder;
  const isBanner = variant === "banner";
  const previewSizeClass = variant === "cover" ? "size-20" : "size-16";

  const sheet = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 opacity-70" />
            Choose image
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
              disabled={uploading}
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
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
                <p className="text-muted-foreground py-6 text-sm">
                  No images in the library yet. Upload one above.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.title}
                      className={cn(
                        "border-border bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring relative aspect-square overflow-hidden rounded-md border transition-colors",
                        "focus-visible:ring-2 focus-visible:outline-none",
                        value === item.url && "ring-foreground ring-2"
                      )}
                      onClick={() => selectImage(item.url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" className="size-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-border shrink-0 space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Image URL
            </p>
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
              <Button type="button" size="sm" variant="secondary" onClick={submitUrl}>
                Use
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (isBanner) {
    return (
      <>
        <div className={cn("group relative w-full", className)}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "relative block w-full overflow-hidden rounded-2xl border border-black/8 bg-white/50 text-left transition",
              "aspect-[21/9] min-h-[180px] max-h-[320px]",
              "hover:border-black/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onClick={() => setOpen(true)}
            title={value ? "Change hero image" : placeholder}
          >
            {value ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f3f3f3]/80">
                <ImageIcon className="size-8 opacity-50" />
                <span className="text-sm font-medium">{placeholder}</span>
              </div>
            )}

            {value ? (
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
            ) : null}

            {value ? (
              <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur-sm transition group-hover:opacity-100">
                <ImageIcon className="size-3.5" />
                Change hero image
              </span>
            ) : null}
          </button>

          {value ? (
            <button
              type="button"
              disabled={disabled}
              className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full border border-black/10 bg-white/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove hero image"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {sheet}
      </>
    );
  }

  return (
    <>
      <div className={cn("flex min-w-0 items-center gap-2", className)}>
        <div className={cn("relative shrink-0", previewSizeClass)}>
          <button
            type="button"
            disabled={disabled}
            className="border-border bg-muted/30 size-full overflow-hidden rounded-xl border transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setOpen(true)}
            title={value ? "Change image" : placeholder}
          >
            {value ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={value} alt="" className="size-full object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                {variant === "avatar" ? (
                  <span className="text-sm font-medium">{fallbackLabel}</span>
                ) : (
                  <ImageIcon className="size-6" />
                )}
              </div>
            )}
          </button>

          {value ? (
            <button
              type="button"
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground absolute -top-1.5 -right-1.5 z-10 inline-flex size-5 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove image"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
            >
              <X className="size-2.5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-black/12 bg-white px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setOpen(true)}
        >
          <ImageIcon className="size-3.5" />
          {changeLabel}
        </button>
      </div>
      {sheet}
    </>
  );
}
