"use client";

import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { usePlatformShortcutKeys } from "@/hooks/use-platform-shortcut-keys";
import { cn } from "@/lib/utils";

export function ContentCreateButton({
  label,
  isPending = false,
  pendingLabel = "Creating...",
  onClick,
  className,
}: {
  label: string;
  isPending?: boolean;
  pendingLabel?: string;
  onClick: () => void;
  className?: string;
}) {
  const shortcutKeys = usePlatformShortcutKeys("N");

  return (
    <button
      type="button"
      className={cn(buttonVariants({ size: "lg" }), "gap-2", className)}
      onClick={onClick}
      disabled={isPending}
    >
      <Plus className="size-4 shrink-0" />
      <span>{isPending ? pendingLabel : label}</span>
      {!isPending ? (
        <span
          className="ml-0.5 inline-flex shrink-0 items-center gap-0.5 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-1.5 py-0.5 text-[11px] leading-none font-medium"
          aria-hidden
        >
          {shortcutKeys.map((key) => (
            <span key={key}>{key}</span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
