import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

/**
 * Reusable SEO payload stored separately from primary content fields.
 * Attach to any registered collection via entityType + entityId.
 */
export type ContentSeo = {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  seoImage: string;
  canonicalUrl: string;
  indexable: boolean;
  followLinks: boolean;
};

/** Fields produced by AI SEO generation (starting point for editors). */
export type ContentSeoAiDraft = Pick<ContentSeo, "seoTitle" | "seoDescription" | "seoKeywords">;

/** Persisted SEO row including collection reference. */
export type ContentSeoRecord = ContentSeo & {
  id: string;
  entityType: ContentSeoEntityType;
  entityId: string;
  aiGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Live page context sent to the SEO AI service. */
export type SeoGenerationContext = {
  title: string;
  content: string;
  headings: string[];
  collectionType: string;
};

/** Partial update — only supplied fields are written. */
export type ContentSeoUpdate = Partial<ContentSeo>;

/** Reference to a content row that can have SEO metadata. */
export type ContentSeoRef = {
  entityType: ContentSeoEntityType;
  entityId: string;
};

/** Attach loaded SEO to any content DTO in the app layer. */
export type WithContentSeo<T> = T & {
  seo: ContentSeo;
};
