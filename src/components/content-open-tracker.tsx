"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { parseContentOpenFromRoute } from "@/lib/content-open-shared";
import { recordContentOpenClient } from "@/lib/content-open-client";

/** Records opens from deep links and full-view URLs. */
export function ContentOpenTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const parsed = parseContentOpenFromRoute(pathname, searchParams);
    if (!parsed) {
      lastKeyRef.current = null;
      return;
    }

    const key = `${parsed.entityType}:${parsed.entityId}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    void recordContentOpenClient(parsed.entityType, parsed.entityId);
  }, [pathname, searchParams]);

  return null;
}
