export const CONTENT_ENTITY_TYPES = [
  "project",
  "blogPost",
  "portfolioItem",
  "teamMember",
  "event",
  "property",
  "job",
] as const;

export type ContentEntityType = (typeof CONTENT_ENTITY_TYPES)[number];

const ENTITY_SECTION_PATH: Record<ContentEntityType, string> = {
  project: "projects",
  blogPost: "blog",
  portfolioItem: "portfolio",
  teamMember: "team",
  event: "events",
  property: "immobilien",
  job: "jobs",
};

export type DashboardRecentBoard = {
  id: string;
  title: string;
  pathLabel: string;
  href: string;
  openedAt: string;
  previewCells: string[];
};

export function contentPathLabel(entityType: ContentEntityType, slug: string): string {
  return `${ENTITY_SECTION_PATH[entityType]}/${slug}`;
}

export function parseContentOpenFromRoute(
  pathname: string,
  searchParams: URLSearchParams
): { entityType: ContentEntityType; entityId: string } | null {
  const routes: Array<{
    prefix: string;
    entityType: ContentEntityType;
    param: string;
  }> = [
    { prefix: "/blog", entityType: "blogPost", param: "postId" },
    { prefix: "/projects", entityType: "project", param: "projectId" },
    { prefix: "/portfolio", entityType: "portfolioItem", param: "itemId" },
    { prefix: "/team", entityType: "teamMember", param: "memberId" },
    { prefix: "/events", entityType: "event", param: "eventId" },
    { prefix: "/immobilien", entityType: "property", param: "propertyId" },
    { prefix: "/jobs", entityType: "job", param: "jobId" },
  ];

  for (const route of routes) {
    if (!pathname.startsWith(route.prefix)) continue;
    const id = searchParams.get(route.param)?.trim();
    if (id) return { entityType: route.entityType, entityId: id };
  }

  return null;
}
