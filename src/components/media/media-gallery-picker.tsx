"use client";

import { ImageIcon, X } from "lucide-react";

import { MediaImagePicker } from "@/components/media/media-image-picker";
import { cn } from "@/lib/utils";

type MediaGalleryPickerProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export function MediaGalleryPicker({
  value,
  onChange,
  disabled = false,
  className,
}: MediaGalleryPickerProps) {
  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function append(url: string) {
    const next = url.trim();
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="border-border bg-muted/30 relative aspect-square overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" loading="lazy" />
              <button
                type="button"
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove gallery image"
                onClick={() => removeAt(index)}
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No gallery images yet.</p>
      )}

      <div className="flex items-center gap-2">
        <MediaImagePicker
          value=""
          variant="cover"
          placeholder="Add gallery image"
          disabled={disabled}
          onChange={append}
        />
        {value.length > 0 ? (
          <button
            type="button"
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onChange([])}
          >
            <ImageIcon className="size-3.5" />
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
