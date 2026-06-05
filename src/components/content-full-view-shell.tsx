"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Pencil, Settings, Sparkles, Trash2 } from "lucide-react";

import { ContentFullViewSeoPanel } from "@/components/content-full-view-seo-panel";
import { ContentFullViewSettingsMenu } from "@/components/content-full-view-settings-menu";
import { ContentFullViewPanelTrigger } from "@/components/content-full-view-panel";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContentSeoEditorContext } from "@/lib/seo";
import { cn } from "@/lib/utils";

type ContentFullViewShellProps = {
  title: string;
  onBack: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  /** Metadata fields shown in the settings panel. */
  settingsContent?: ReactNode;
  onAi?: () => void;
  showSeo?: boolean;
  /** Live editor state for AI SEO generation in the SEO panel. */
  seoContext?: ContentSeoEditorContext | null;
  children: ReactNode;
  className?: string;
};

export const CONTENT_FULL_VIEW_RENAME_ID = "content-full-view-rename-target";

export const contentFullViewGridClassName = "content-full-view-grid min-h-full";

const contentFullViewGridStyle = {
  backgroundColor: "#e8e8e8",
  backgroundImage:
    "radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  backgroundRepeat: "repeat",
  backgroundPosition: "0 0",
} as const;

export const contentFullViewTitleClassName =
  "font-heading mb-10 block field-sizing-content min-h-[1.2em] w-full resize-none overflow-visible whitespace-normal break-words border-0 bg-transparent px-0 py-2 !text-5xl font-semibold !leading-[1.2] tracking-[-0.03em] shadow-none outline-none focus-visible:ring-0 md:!text-6xl";

export function focusContentFullViewRename() {
  document.getElementById(CONTENT_FULL_VIEW_RENAME_ID)?.focus();
}

type SidePanel = "settings" | "seo" | null;

export function ContentFullViewShell({
  title,
  onBack,
  onRename,
  onDelete,
  settingsContent,
  onAi,
  showSeo = true,
  seoContext = null,
  children,
  className,
}: ContentFullViewShellProps) {
  const displayTitle = title.trim() || "Untitled";
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);

  function openPanel(panel: SidePanel) {
    setSidePanel((current) => (current === panel ? null : panel));
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-[#e8e8e8]",
        className
      )}
    >
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-5 py-4">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Back to list"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "size-9 shrink-0 rounded-full bg-white/70 text-foreground shadow-sm hover:bg-white"
            )}
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex min-w-0 max-w-[min(420px,50vw)] items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-left shadow-sm transition-colors hover:bg-white"
                />
              }
            >
              <span className="truncate text-sm font-semibold tracking-tight">{displayTitle}</span>
              <ChevronDown className="text-muted-foreground size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {onRename ? (
                <DropdownMenuItem onClick={onRename}>
                  <Pencil className="size-4" />
                  Rename
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <ContentFullViewPanelTrigger
            icon={Sparkles}
            label="AI Content Creation"
            onClick={() => {
              setSidePanel(null);
              onAi?.();
            }}
          />
          {settingsContent ? (
            <ContentFullViewSettingsMenu
              open={sidePanel === "settings"}
              onOpenChange={(open) => setSidePanel(open ? "settings" : null)}
              onTriggerClick={() => openPanel("settings")}
              triggerActive={sidePanel === "settings"}
            >
              {settingsContent}
            </ContentFullViewSettingsMenu>
          ) : (
            <ContentFullViewPanelTrigger
              icon={Settings}
              label="Site Settings"
              disabled
            />
          )}
          {showSeo ? (
            <ContentFullViewSeoPanel
              open={sidePanel === "seo"}
              onOpenChange={(open) => setSidePanel(open ? "seo" : null)}
              onTriggerClick={() => openPanel("seo")}
              triggerActive={sidePanel === "seo"}
              seoContext={seoContext}
            />
          ) : null}
        </div>
      </header>

      <div className="relative z-0 h-full min-h-0 overflow-x-hidden overflow-y-auto">
        <div
          className={cn(contentFullViewGridClassName, "px-6 pt-[4.75rem] pb-24")}
          style={contentFullViewGridStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
