"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getContentCreateRoute } from "@/lib/content-create";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

/** ⌘N / Ctrl+N dispatches a page-specific create event on list routes. */
export function useCreateShortcut(options?: { disabled?: boolean }) {
  const pathname = usePathname();
  const disabled = options?.disabled ?? false;

  useEffect(() => {
    if (disabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "n") return;
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const route = getContentCreateRoute(pathname);
      if (!route) return;

      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent(route.eventName));
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [disabled, pathname]);
}
