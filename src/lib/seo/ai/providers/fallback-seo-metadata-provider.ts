import { z } from "zod";

import { generateObjectWithFallback } from "@/lib/ai/run-with-fallback";
import type { SeoMetadataProvider } from "@/lib/seo/ai/provider";
import type { SeoGenerationContext, SeoMetadataProviderResult } from "@/lib/seo/ai/types";

const seoDraftSchema = z.object({
  seoTitle: z.string().min(8).max(70),
  seoDescription: z.string().min(40).max(165),
  seoKeywords: z.array(z.string().min(2).max(48)).min(3).max(10),
});

const SYSTEM_PROMPT = [
  "You are an expert SEO strategist for a premium design-studio CMS.",
  "Generate search metadata that is clear, accurate, and compelling.",
  "Treat your output as a starting draft — editors will refine it.",
  "seoTitle: ~50–60 characters, include primary topic.",
  "seoDescription: ~140–155 characters, active voice, one clear value prop.",
  "seoKeywords: 5–8 specific phrases, lowercase, no duplicates.",
].join(" ");

function buildUserPrompt(context: SeoGenerationContext): string {
  return JSON.stringify(
    {
      collectionType: context.collectionType,
      pageTitle: context.title,
      headings: context.headings,
      contentExcerpt: context.content,
    },
    null,
    2
  );
}

export class FallbackSeoMetadataProvider implements SeoMetadataProvider {
  async generate(context: SeoGenerationContext): Promise<SeoMetadataProviderResult | null> {
    const object = await generateObjectWithFallback({
      tier: "seo",
      schema: seoDraftSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(context),
      temperature: 0.35,
    });

    if (!object) return null;

    return {
      seoTitle: object.seoTitle.trim(),
      seoDescription: object.seoDescription.trim(),
      seoKeywords: object.seoKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
    };
  }
}
