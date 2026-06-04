/**
 * Client-safe SEO exports. For Prisma/repository use "@/lib/seo/server".
 */
export {
  CONTENT_SEO_ENTITY_TYPES,
  isContentSeoEntityType,
  type ContentSeoEntityType,
} from "@/lib/seo/entity-types";

export {
  getContentSeoEntityDefinition,
  isRegisteredContentSeoEntity,
  listContentSeoEntities,
  registerContentSeoEntity,
  type ContentSeoEntityDefinition,
} from "@/lib/seo/entity-registry";

export { createDefaultContentSeo } from "@/lib/seo/defaults";
export { formatSeoGeneratedAgo } from "@/lib/seo/format-relative";
export { analyzePageContent, SEO_MIN_CONTENT_CHARS } from "@/lib/seo/analyze-content";
export {
  computeSeoScore,
  estimateSeoScore,
  type SeoCheck,
  type SeoCheckId,
  type SeoScoreInput,
  type SeoScoreResult,
  type SeoWarning,
  type SeoWarningId,
} from "@/lib/seo/score";
export { extractHeadingsFromContent } from "@/lib/seo/extract-headings";
export type { ContentSeoEditorContext } from "@/lib/seo/editor-context";

export type {
  SeoContentOpportunity,
  SeoInsightApplyField,
  SeoInsightApplyPayload,
  SeoInsightsContext,
  SeoInsightsResult,
  SeoInternalLinkSuggestion,
  SeoSearchIntentInsight,
} from "@/lib/seo/ai/insights/types";

export { contentSeoRefSchema, contentSeoSchema, type ContentSeoSchemaInput } from "@/lib/seo/schema";

export type {
  ContentSeo,
  ContentSeoRecord,
  ContentSeoRef,
  ContentSeoUpdate,
  WithContentSeo,
} from "@/types/seo";
