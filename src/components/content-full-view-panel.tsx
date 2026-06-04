"use client";

import type { ComponentType, ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const contentFullViewActionButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "size-9 rounded-lg bg-white/70 text-foreground shadow-sm hover:bg-white"
);

type ContentFullViewPanelTriggerProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function ContentFullViewPanelTrigger({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: ContentFullViewPanelTriggerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        contentFullViewActionButtonClassName,
        active && "bg-white ring-1 ring-black/10",
        disabled && "cursor-not-allowed text-foreground/40 hover:bg-white/70"
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
    </button>
  );
}

type ContentFullViewPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ContentFullViewPanel({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: ContentFullViewPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full flex-col gap-0 border-l border-black/8 bg-white p-0 sm:max-w-[400px]"
      >
        <SheetHeader className="shrink-0 border-b border-black/6 px-5 py-5 text-left">
          <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-[13px] leading-snug">
            {subtitle}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function ContentFullViewPanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-[11px] font-medium tracking-[0.08em] text-foreground/45 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ContentFullViewPanelField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-foreground/80">{label}</p>
      {children}
    </div>
  );
}

export function ContentFullViewPanelPlaceholder({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-black/8 bg-[#f7f7f7] px-3 py-2.5 text-[13px] text-foreground/40",
        className
      )}
    >
      {children}
    </div>
  );
}
