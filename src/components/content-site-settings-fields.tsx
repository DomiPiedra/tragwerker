"use client";

import { CircleDot } from "lucide-react";

import { ContentFullViewPanelField } from "@/components/content-full-view-panel";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ContentSiteSettingsFieldsProps = {
  published: boolean;
  onPublishedChange: (published: boolean) => void;
  publishedAt?: string;
  onPublishedAtChange?: (value: string) => void;
  splitPublishedAt?: (value: string) => { date: string; time: string };
  mergePublishedAt?: (date: string, time: string) => string;
  disabled?: boolean;
};

export function ContentSiteSettingsFields({
  published,
  onPublishedChange,
  publishedAt,
  onPublishedAtChange,
  splitPublishedAt,
  mergePublishedAt,
  disabled = false,
}: ContentSiteSettingsFieldsProps) {
  const showSchedule =
    published &&
    publishedAt !== undefined &&
    onPublishedAtChange &&
    splitPublishedAt &&
    mergePublishedAt;

  return (
    <div className="space-y-4">
      <ContentFullViewPanelField label="Visibility">
        <select
          value={published ? "published" : "unpublished"}
          disabled={disabled}
          onChange={(e) => onPublishedChange(e.target.value === "published")}
          className={cn(
            "h-9 w-full rounded-lg border-0 px-3 text-sm font-medium shadow-none outline-none appearance-none",
            published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
          )}
        >
          <option value="unpublished">Unpublished</option>
          <option value="published">Published</option>
        </select>
      </ContentFullViewPanelField>

      {showSchedule ? (
        <ContentFullViewPanelField label="Published at">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              disabled={disabled}
              value={splitPublishedAt(publishedAt).date}
              className="h-9 w-full min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-100/80 px-3 text-sm text-zinc-700 shadow-none outline-none appearance-none sm:w-fit sm:flex-none"
              onChange={(e) => {
                const current = splitPublishedAt(publishedAt);
                onPublishedAtChange(mergePublishedAt(e.target.value, current.time));
              }}
            />
            <Input
              type="time"
              disabled={disabled}
              value={splitPublishedAt(publishedAt).time}
              className="h-9 w-full min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-100/80 px-3 text-sm text-zinc-700 shadow-none outline-none appearance-none sm:w-fit sm:flex-none"
              onChange={(e) => {
                const current = splitPublishedAt(publishedAt);
                onPublishedAtChange(mergePublishedAt(current.date, e.target.value));
              }}
            />
          </div>
        </ContentFullViewPanelField>
      ) : null}

      <p className="text-muted-foreground text-xs leading-relaxed">
        {published
          ? "This page is visible on your site."
          : "This page is hidden from your site until you publish it."}
      </p>
    </div>
  );
}

/** Inline row for list preview panels (non–full-view). */
export function ContentSiteSettingsInlineRow({
  published,
  onPublishedChange,
  disabled = false,
}: Pick<ContentSiteSettingsFieldsProps, "published" | "onPublishedChange" | "disabled">) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <CircleDot className="size-3.5" />
        Visibility
      </label>
      <select
        value={published ? "published" : "unpublished"}
        disabled={disabled}
        onChange={(e) => onPublishedChange(e.target.value === "published")}
        className={cn(
          "h-8 w-fit rounded-full border-0 px-3 text-sm font-medium shadow-none outline-none appearance-none pr-8",
          published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
        )}
      >
        <option value="unpublished">Unpublished</option>
        <option value="published">Published</option>
      </select>
    </div>
  );
}
