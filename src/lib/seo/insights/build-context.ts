import { getContentSeoEntityDefinition } from "@/lib/seo/entity-registry";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import type { SeoInsightsContext } from "@/lib/seo/ai/insights/types";
import { buildSeoContextFromEditor } from "@/lib/seo/server/load-context";
import type { ContentSeo } from "@/types/seo";

export function buildSeoInsightsContext(input: {
  entityType: ContentSeoEntityType;
  title: string;
  content: string;
  headings?: string[];
  existingMetadata: ContentSeo;
}): SeoInsightsContext {
  const label = getContentSeoEntityDefinition(input.entityType).label;
  const base = buildSeoContextFromEditor({
    title: input.title,
    content: input.content,
    headings: input.headings,
    collectionType: label,
  });

  return {
    ...base,
    existingMetadata: {
      seoTitle: input.existingMetadata.seoTitle,
      seoDescription: input.existingMetadata.seoDescription,
      seoKeywords: input.existingMetadata.seoKeywords,
      seoImage: input.existingMetadata.seoImage,
    },
  };
}
