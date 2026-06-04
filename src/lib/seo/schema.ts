import { z } from "zod";

import { CONTENT_SEO_ENTITY_TYPES } from "@/lib/seo/entity-types";

/** Validates API / form payloads for SEO updates. */
export const contentSeoSchema = z.object({
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(320).optional(),
  seoKeywords: z.array(z.string().max(64)).max(32).optional(),
  seoImage: z.string().max(2048).optional(),
  canonicalUrl: z.string().max(2048).optional(),
  indexable: z.boolean().optional(),
  followLinks: z.boolean().optional(),
});

export const contentSeoRefSchema = z.object({
  entityType: z.enum(CONTENT_SEO_ENTITY_TYPES),
  entityId: z.string().min(1),
});

export type ContentSeoSchemaInput = z.infer<typeof contentSeoSchema>;
