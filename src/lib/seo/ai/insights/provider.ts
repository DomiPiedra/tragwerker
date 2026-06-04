import type { SeoInsightsContext, SeoInsightsResult } from "@/lib/seo/ai/insights/types";

/** Pluggable SEO insights reviewer (Azure GPT-5.4, Gemini fallback, etc.). */
export interface SeoInsightsProvider {
  analyze(context: SeoInsightsContext): Promise<SeoInsightsResult | null>;
}
