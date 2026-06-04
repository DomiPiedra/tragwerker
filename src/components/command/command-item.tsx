"use client";

import { ArrowRight, Command, CornerDownLeft, Hash, Pin } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useCommandBarStore } from "@/store/command-bar-store";
import type { CommandDefinition } from "@/types/command";

type Props = {
  command: CommandDefinition;
  active: boolean;
  onHover: () => void;
  onExecute: () => void;
};

export function CommandItem({ command, active, onHover, onExecute }: Props) {
  const pinnedIds = useCommandBarStore((state) => state.pinnedCommandIds);
  const isPinned = pinnedIds.includes(command.id);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onExecute}
      className={cn(
        "relative flex w-full transform-gpu items-center justify-between gap-3 overflow-hidden rounded-md px-3 py-2 text-left transition-colors",
        active ? "text-foreground" : "hover:bg-muted/70 text-muted-foreground"
      )}
    >
      {active ? (
        <motion.div
          layoutId="command-active-highlight"
          className="bg-muted absolute inset-0 rounded-md"
          transition={{ type: "spring", damping: 28, stiffness: 340, mass: 0.45 }}
        />
      ) : null}
      <div className="relative z-10 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{command.title}</p>
          {isPinned ? <Pin className="size-3.5" /> : null}
        </div>
        <p className="truncate text-xs">{command.description}</p>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1.5 text-[11px]">
        {command.shortcut?.map((key) => (
          <kbd key={key} className="bg-background rounded border px-1.5 py-0.5 font-medium">
            {key}
          </kbd>
        ))}
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Hash className="size-3" />
          {command.category}
        </span>
        <CornerDownLeft className="size-3.5" />
        <ArrowRight className="size-3.5" />
        <Command className="size-3.5" />
      </div>
    </button>
  );
}
