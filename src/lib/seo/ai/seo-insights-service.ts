import { FallbackSeoInsightsProvider } from "@/lib/seo/ai/insights/providers/fallback-seo-insights-provider";
import type { SeoInsightsProvider } from "@/lib/seo/ai/insights/provider";
import type { SeoInsightsContext, SeoInsightsResult } from "@/lib/seo/ai/insights/types";

let defaultProvider: SeoInsightsProvider | null = null;

export function getSeoInsightsProvider(): SeoInsightsProvider {
  if (!defaultProvider) {
    defaultProvider = new FallbackSeoInsightsProvider();
  }
  return defaultProvider;
}

export function setSeoInsightsProvider(provider: SeoInsightsProvider) {
  defaultProvider = provider;
}

export class SeoInsightsService {
  constructor(private readonly provider: SeoInsightsProvider = getSeoInsightsProvider()) {}

  async analyze(context: SeoInsightsContext): Promise<SeoInsightsResult | null> {
    return this.provider.analyze(context);
  }
}

export const seoInsightsService = new SeoInsightsService();
