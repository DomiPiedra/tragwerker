import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

export type ContentSeoEntityDefinition = {
  /** Stable key stored in ContentSeo.entityType */
  id: ContentSeoEntityType;
  /** Human label for admin UI */
  label: string;
  /** Prisma model name (documentation / future tooling) */
  prismaModel: string;
  /** Public URL segment when known */
  pathSegment?: string;
};

const registry = new Map<ContentSeoEntityType, ContentSeoEntityDefinition>();

function defineEntity(definition: ContentSeoEntityDefinition) {
  registry.set(definition.id, definition);
}

/** Built-in collections with SEO support. */
defineEntity({ id: "page", label: "Page", prismaModel: "Page", pathSegment: "pages" });
defineEntity({ id: "blogPost", label: "Blog Post", prismaModel: "BlogPost", pathSegment: "blog" });
defineEntity({ id: "project", label: "Project", prismaModel: "Project", pathSegment: "projects" });
defineEntity({ id: "service", label: "Service", prismaModel: "Service", pathSegment: "services" });
defineEntity({
  id: "teamMember",
  label: "Team Member",
  prismaModel: "TeamMember",
  pathSegment: "team",
});
defineEntity({
  id: "portfolioItem",
  label: "Portfolio",
  prismaModel: "PortfolioItem",
  pathSegment: "portfolio",
});
defineEntity({ id: "event", label: "Event", prismaModel: "Event", pathSegment: "events" });
defineEntity({
  id: "property",
  label: "Property",
  prismaModel: "Property",
  pathSegment: "immobilien",
});

/**
 * Register SEO for a new collection at runtime or from a module init.
 * Call during app/bootstrap when adding a custom content type.
 */
export function registerContentSeoEntity(definition: ContentSeoEntityDefinition) {
  registry.set(definition.id, definition);
}

export function getContentSeoEntityDefinition(
  entityType: ContentSeoEntityType
): ContentSeoEntityDefinition {
  const definition = registry.get(entityType);
  if (!definition) {
    throw new Error(`Unknown SEO entity type: ${entityType}`);
  }
  return definition;
}

export function listContentSeoEntities(): ContentSeoEntityDefinition[] {
  return Array.from(registry.values());
}

export function isRegisteredContentSeoEntity(
  entityType: string
): entityType is ContentSeoEntityType {
  return registry.has(entityType as ContentSeoEntityType);
}
