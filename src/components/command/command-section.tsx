"use client";

import type { ReactNode } from "react";

export function CommandSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <p className="text-muted-foreground px-2 pb-1 text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
