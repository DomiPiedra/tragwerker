"use client";

import { Mic, Plus } from "lucide-react";

import { useCommandBarStore } from "@/store/command-bar-store";

export function CommandBarTrigger() {
  const open = useCommandBarStore((state) => state.open);
  const resetSessionState = useCommandBarStore((state) => state.resetSessionState);

  return (
    <button
      type="button"
      onClick={() => {
        resetSessionState();
        open();
      }}
      className="bg-background border-border flex h-11 w-full max-w-xl items-center rounded-full border px-3 text-left shadow-sm"
      aria-label="Open command bar"
    >
      <Plus className="text-muted-foreground mr-2 size-4" />
      <span className="text-muted-foreground flex-1 text-sm">Describe your next move!</span>
      <Mic className="text-muted-foreground size-4" />
    </button>
  );
}
