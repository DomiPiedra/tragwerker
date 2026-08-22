import type { Metadata } from "next";

import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { getContentSeo } from "@/lib/seo/repository";
import { absoluteUrl } from "@/website/tragwerker/config";

type MetadataFallback = {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
};

export async function buildEntityMetadata(
  entityType: ContentSeoEntityType,
  entityId: string,
  fallback: MetadataFallback
): Promise<Metadata> {
  const seo = await getContentSeo({ entityType, entityId });
  const title = seo?.seoTitle?.trim() || fallback.title;
  const description = seo?.seoDescription?.trim() || fallback.description;
  const canonical = seo?.canonicalUrl?.trim() || absoluteUrl(fallback.path);
  const image = seo?.seoImage?.trim() || fallback.imageUrl || undefined;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "de_DE",
      images: image ? [{ url: image.startsWith("http") ? image : absoluteUrl(image) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.startsWith("http") ? image : absoluteUrl(image)] : undefined,
    },
  };
}

export function buildStaticMetadata(fallback: MetadataFallback): Metadata {
  return {
    title: fallback.title,
    description: fallback.description,
    alternates: { canonical: absoluteUrl(fallback.path) },
    robots: { index: false, follow: false },
    openGraph: {
      title: fallback.title,
      description: fallback.description,
      url: absoluteUrl(fallback.path),
      type: "website",
      locale: "de_DE",
      images: fallback.imageUrl
        ? [{ url: fallback.imageUrl.startsWith("http") ? fallback.imageUrl : absoluteUrl(fallback.imageUrl) }]
        : undefined,
    },
  };
}
