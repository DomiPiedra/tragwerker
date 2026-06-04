import type { ContentSeo, SeoGenerationContext } from "@/types/seo";

export type SeoInsightsContext = SeoGenerationContext & {
  existingMetadata: Pick<ContentSeo, "seoTitle" | "seoDescription" | "seoKeywords" | "seoImage">;
};

export type SeoInternalLinkSuggestion = {
  anchorText: string;
  targetHint: string;
  reason: string;
};

export type SeoContentOpportunity = {
  title: string;
  detail: string;
};

export type SeoSearchIntentInsight = {
  summary: string;
  suggestions: string[];
};

export type SeoInsightsResult = {
  suggestedSeoTitle: string | null;
  suggestedMetaDescription: string | null;
  suggestedKeywords: string[];
  missingSearchIntent: SeoSearchIntentInsight | null;
  suggestedInternalLinks: SeoInternalLinkSuggestion[];
  contentOpportunities: SeoContentOpportunity[];
};

export type SeoInsightApplyField = "seoTitle" | "seoDescription" | "seoKeywords";

export type SeoInsightApplyPayload = {
  field: SeoInsightApplyField;
  value: string | string[];
};
