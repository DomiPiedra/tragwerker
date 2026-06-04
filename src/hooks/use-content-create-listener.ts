"use client";

import { useEffect } from "react";

import type { ContentCreateEventName } from "@/lib/content-create";

export function useContentCreateListener(
  eventName: ContentCreateEventName,
  onCreate: () => void
) {
  useEffect(() => {
    const handler = () => onCreate();
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, onCreate]);
}
