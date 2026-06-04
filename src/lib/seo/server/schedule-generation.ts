import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { generateAndPersistSeoFromDb } from "@/lib/seo/server/generate-and-persist";

/**
 * Non-blocking SEO generation after content create/update.
 * Runs in the same server process without delaying the mutation response.
 */
export function scheduleContentSeoGeneration(
  entityType: ContentSeoEntityType,
  entityId: string
): void {
  void generateAndPersistSeoFromDb(entityType, entityId).catch((error) => {
    console.error(`[seo] scheduled generation error (${entityType}/${entityId}):`, error);
  });
}
