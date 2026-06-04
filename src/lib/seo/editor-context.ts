import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

/** Live editor state passed into the SEO panel (client-safe). */
export type ContentSeoEditorContext = {
  entityType: ContentSeoEntityType;
  entityId: string;
  title: string;
  content: string;
  headings?: string[];
};
