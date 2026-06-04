"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ContentPreviewResizeHandleProps = {
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
};

/** Vertical splitter grip for slide-over preview panels (viewport-fixed, line + pill). */
export function ContentPreviewResizeHandle({
  onMouseDown,
  className,
}: ContentPreviewResizeHandleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="separator"
      aria-label="Resize editor panel"
      aria-orientation="vertical"
      className={cn(
        "fixed top-0 z-[45] h-svh w-8 -translate-x-1/2 cursor-ew-resize select-none",
        className
      )}
      style={{ left: "calc(100vw - var(--preview-panel-width, 390px))" }}
      onMouseDown={onMouseDown}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300/90"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-1/2 left-1/2 box-border h-10 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/90 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        aria-hidden
      />
    </div>,
    document.body
  );
}
