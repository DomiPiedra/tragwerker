import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { listContentSeoEntities } from "@/lib/seo/entity-registry";

export type MappedEntity = {
  entityType: ContentSeoEntityType;
  entityId: string;
  entityTitle: string;
  editHref: string;
};

export function editorDeepLink(
  entityType: ContentSeoEntityType,
  entityId: string
): string {
  switch (entityType) {
    case "blogPost":
      return `/blog?postId=${encodeURIComponent(entityId)}&blogView=full`;
    case "project":
      return `/projects?projectId=${encodeURIComponent(entityId)}&projectView=full`;
    case "portfolioItem":
      return `/portfolio?itemId=${encodeURIComponent(entityId)}&portfolioView=full`;
    case "event":
      return `/events?eventId=${encodeURIComponent(entityId)}&eventView=full`;
    case "property":
      return `/immobilien?propertyId=${encodeURIComponent(entityId)}&propertyView=full`;
    case "job":
      return `/jobs?jobId=${encodeURIComponent(entityId)}&jobView=full`;
    case "teamMember":
      return `/team?memberId=${encodeURIComponent(entityId)}&teamView=full`;
    case "page":
      return `/pages?pageId=${encodeURIComponent(entityId)}`;
    case "service":
      return `/services?serviceId=${encodeURIComponent(entityId)}`;
    default:
      return "/analytics";
  }
}

/** Normalize a page path from GA (may include query / host). */
export function normalizeAnalyticsPath(raw: string): string {
  let path = raw.trim();
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      path = new URL(path).pathname;
    }
  } catch {
    // keep raw
  }
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/**
 * Match `/blog/my-slug` style paths to a CMS entity using registry pathSegment + slug lookup map.
 */
export function matchPathToEntity(
  path: string,
  slugIndex: Map<string, { entityType: ContentSeoEntityType; entityId: string; title: string }>
): MappedEntity | null {
  const normalized = normalizeAnalyticsPath(path);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const entities = listContentSeoEntities().filter((e) => e.pathSegment);
  for (const def of entities) {
    const seg = def.pathSegment!;
    if (segments[0] !== seg) continue;
    const slug = segments[1];
    if (!slug) continue;
    const hit = slugIndex.get(`${def.id}:${slug}`);
    if (!hit) continue;
    return {
      entityType: hit.entityType,
      entityId: hit.entityId,
      entityTitle: hit.title,
      editHref: editorDeepLink(hit.entityType, hit.entityId),
    };
  }
  return null;
}
