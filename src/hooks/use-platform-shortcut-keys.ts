"use client";

import { useEffect, useState } from "react";

/** Platform-aware modifier + key for UI hints (⌘ N on macOS, Ctrl N on Windows/Linux). */
export function usePlatformShortcutKeys(key: string): string[] {
  const [keys, setKeys] = useState<string[]>(["⌘", key]);

  useEffect(() => {
    const isMac =
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ||
      /Mac/i.test(navigator.userAgent);
    setKeys(isMac ? ["⌘", key] : ["Ctrl", key]);
  }, [key]);

  return keys;
}
