import { useEffect } from "react";

import { useCommandBarStore } from "@/store/command-bar-store";

export function useCommandShortcut() {
  const open = useCommandBarStore((state) => state.open);
  const close = useCommandBarStore((state) => state.close);
  const isOpen = useCommandBarStore((state) => state.isOpen);
  const resetSessionState = useCommandBarStore((state) => state.resetSessionState);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const pressedK = event.key.toLowerCase() === "k";
      const withMeta = event.metaKey || event.ctrlKey;
      if (pressedK && withMeta) {
        event.preventDefault();
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

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen, open, resetSessionState]);
}
