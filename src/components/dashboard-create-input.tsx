"use client";

import { ArrowUp, Mic, Paperclip } from "lucide-react";

import { useCommandBarStore } from "@/store/command-bar-store";
import { cn } from "@/lib/utils";

export function DashboardCreateInput({ className }: { className?: string }) {
  const open = useCommandBarStore((state) => state.open);
  const resetSessionState = useCommandBarStore((state) => state.resetSessionState);

  function handleOpen() {
    resetSessionState();
    open();
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={cn(
        "group relative flex w-full max-w-3xl flex-col rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-black/6 transition-shadow hover:shadow-md",
        className
      )}
      aria-label="Open command bar to create content"
    >
      <span className="text-muted-foreground text-[15px] font-normal">
        Describe what you want to create...
      </span>
      <span className="mt-6 flex items-center justify-end gap-2">
        <span className="text-muted-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors group-hover:bg-black/5">
          <Paperclip className="size-4" />
        </span>
        <span className="text-muted-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors group-hover:bg-black/5">
          <Mic className="size-4" />
        </span>
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background">
          <ArrowUp className="size-4" />
        </span>
      </span>
    </button>
  );
}
