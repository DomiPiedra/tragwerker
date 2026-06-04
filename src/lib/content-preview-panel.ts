"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_PREVIEW_PANEL_WIDTH = 390;
const MIN_PREVIEW_PANEL_WIDTH = 320;
const PREVIEW_PANEL_WIDTH_VAR = "--preview-panel-width";

export function previewPanelWidthStyle(
  width = DEFAULT_PREVIEW_PANEL_WIDTH
): { width: string } {
  return { width: `var(${PREVIEW_PANEL_WIDTH_VAR}, ${width}px)` };
}

export function usePreviewPanelResize(initialWidth = DEFAULT_PREVIEW_PANEL_WIDTH) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(initialWidth);

  const applyWidth = useCallback((width: number) => {
    widthRef.current = width;
    document.documentElement.style.setProperty(PREVIEW_PANEL_WIDTH_VAR, `${width}px`);
  }, []);

  useEffect(() => {
    applyWidth(panelWidth);
  }, [applyWidth, panelWidth]);

  const startPanelResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const maxWidth = Math.max(520, window.innerWidth - 220);
      setIsResizing(true);

      function onMouseMove(moveEvent: MouseEvent) {
        const nextWidth = window.innerWidth - moveEvent.clientX;
        const clamped = Math.max(
          MIN_PREVIEW_PANEL_WIDTH,
          Math.min(maxWidth, nextWidth)
        );
        applyWidth(clamped);
      }

      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizing(false);
        setPanelWidth(widthRef.current);
      }

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [applyWidth]
  );

  return { panelWidth, isResizing, startPanelResize, panelStyle: previewPanelWidthStyle(panelWidth) };
}

const PREVIEW_CLICK_DELAY_MS = 250;

/** Defers single-click so double-click can open full view without flashing preview. */
export function useContentRowClickHandlers() {
  const timerRef = useRef<number | null>(null);

  const cancelPendingPreview = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedulePreview = useCallback(
    (openPreview: () => void) => {
      cancelPendingPreview();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        openPreview();
      }, PREVIEW_CLICK_DELAY_MS);
    },
    [cancelPendingPreview]
  );

  const openFull = useCallback(
    (openFullView: () => void) => {
      cancelPendingPreview();
      openFullView();
    },
    [cancelPendingPreview]
  );

  useEffect(() => () => cancelPendingPreview(), [cancelPendingPreview]);

  return { schedulePreview, openFull };
}

/** Slide-over editor panel (preview mode) and full-page editor layout. */
export function contentPreviewPanelClassName(
  mode: "preview" | "full",
  visible: boolean,
  extra?: string
) {
  return cn(
    "bg-background/95 border-border right-0 z-30 border-l px-6 py-7 backdrop-blur",
    mode === "full"
      ? "relative mt-4 h-auto w-full rounded-xl border shadow-none"
      : cn(
          "fixed inset-y-0 h-svh overflow-y-auto shadow-sm",
          "transition-[transform,opacity] duration-300 ease-in-out"
        ),
    visible ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-10 opacity-0",
    extra
  );
}
