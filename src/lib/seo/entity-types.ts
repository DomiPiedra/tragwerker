/**
 * SEO-enabled collection keys. Extend by calling registerContentSeoEntity()
 * and adding the id here when introducing a first-class collection.
 */
export const CONTENT_SEO_ENTITY_TYPES = [
  "page",
  "blogPost",
  "project",
  "service",
  "teamMember",
  "portfolioItem",
  "event",
  "property",
] as const;

export type ContentSeoEntityType = (typeof CONTENT_SEO_ENTITY_TYPES)[number];

export function isContentSeoEntityType(value: string): value is ContentSeoEntityType {
  return (CONTENT_SEO_ENTITY_TYPES as readonly string[]).includes(value);
}
