import type { ContentSeo } from "@/types/seo";

export function createDefaultContentSeo(): ContentSeo {
  return {
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    seoImage: "",
    canonicalUrl: "",
    indexable: true,
    followLinks: true,
  };
}
