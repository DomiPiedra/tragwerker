"use client";

import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
  return (
    <button
      type="button"
      className={cn(buttonVariants({ size: "lg" }), "gap-2", className)}
      onClick={onClick}
      disabled={isPending}
    >
      <Plus className="size-4 shrink-0" />
      <span>{isPending ? pendingLabel : label}</span>
    </button>
  );
}
