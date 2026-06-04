import { useEffect } from "react";

import { usePlatformShortcutKeys } from "@/hooks/use-platform-shortcut-keys";
import { useCommandBarStore } from "@/store/command-bar-store";

/** Platform-aware keys for UI hints: ⌘ K (macOS) or Ctrl K (Windows/Linux). */
export function useCommandShortcutKeys(): string[] {
  return usePlatformShortcutKeys("K");
}

export function useCommandShortcut() {
  const open = useCommandBarStore((state) => state.open);
  const close = useCommandBarStore((state) => state.close);
  const isOpen = useCommandBarStore((state) => state.isOpen);
  const resetSessionState = useCommandBarStore((state) => state.resetSessionState);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const pressedK = event.key.toLowerCase() === "k";
      const withMeta = event.metaKey || event.ctrlKey;
      if (pressedK && withMeta && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        if (isOpen) {
          close();
        } else {
          resetSessionState();
          open();
        }
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [close, isOpen, open, resetSessionState]);
}
