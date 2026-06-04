import type { ContentEntityType } from "@/lib/content-open-shared";

export async function recordContentOpenClient(
  entityType: ContentEntityType,
  entityId: string
) {
  try {
    await fetch("/api/content/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
    });
  } catch {
    // Best-effort tracking; ignore network errors.
  }
}
