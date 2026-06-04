"use client";

import { useEffect } from "react";

import { recordContentOpenClient } from "@/lib/content-open-client";
import type { ContentEntityType } from "@/lib/content-open-shared";

/** Records a content open after the user stays on an item briefly (preview or full view). */
export function useTrackContentOpen(
  entityType: ContentEntityType,
  entityId: string | null
) {
  useEffect(() => {
    if (!entityId) return;

    const timer = window.setTimeout(() => {
      void recordContentOpenClient(entityType, entityId);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [entityType, entityId]);
}
