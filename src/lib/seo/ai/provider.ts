import type { SeoGenerationContext, SeoMetadataProviderResult } from "@/lib/seo/ai/types";

/** Pluggable SEO metadata generator (Azure GPT-5.4, Gemini fallback, mocks, etc.). */
export interface SeoMetadataProvider {
  generate(context: SeoGenerationContext): Promise<SeoMetadataProviderResult | null>;
}
