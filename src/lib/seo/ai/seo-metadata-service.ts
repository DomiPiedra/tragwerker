import { FallbackSeoMetadataProvider } from "@/lib/seo/ai/providers/fallback-seo-metadata-provider";
import type { SeoMetadataProvider } from "@/lib/seo/ai/provider";
import type { SeoGenerationContext } from "@/lib/seo/ai/types";
import type { ContentSeoAiDraft } from "@/types/seo";

let defaultProvider: SeoMetadataProvider | null = null;

export function getSeoMetadataProvider(): SeoMetadataProvider {
  if (!defaultProvider) {
    defaultProvider = new FallbackSeoMetadataProvider();
  }
  return defaultProvider;
}

export function setSeoMetadataProvider(provider: SeoMetadataProvider) {
  defaultProvider = provider;
}

export class SeoMetadataService {
  constructor(private readonly provider: SeoMetadataProvider = getSeoMetadataProvider()) {}

  async generateDraft(context: SeoGenerationContext): Promise<ContentSeoAiDraft | null> {
    return this.provider.generate(context);
  }
}

export const seoMetadataService = new SeoMetadataService();
