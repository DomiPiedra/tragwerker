export const CONTENT_CREATE_EVENTS = {
  project: "hcms:create-project",
  blog: "hcms:create-blog",
  portfolio: "hcms:create-portfolio",
  team: "hcms:create-team",
  event: "hcms:create-event",
  property: "hcms:create-property",
} as const;

export type ContentCreateEventName =
  (typeof CONTENT_CREATE_EVENTS)[keyof typeof CONTENT_CREATE_EVENTS];

type ContentCreateRoute = {
  label: string;
  eventName: ContentCreateEventName;
  match: (pathname: string) => boolean;
};

const routes: ContentCreateRoute[] = [
  {
    label: "New Project",
    eventName: CONTENT_CREATE_EVENTS.project,
    match: (p) => p.startsWith("/projects"),
  },
  {
    label: "New Blog",
    eventName: CONTENT_CREATE_EVENTS.blog,
    match: (p) => p.startsWith("/blog"),
  },
  {
    label: "New Portfolio",
    eventName: CONTENT_CREATE_EVENTS.portfolio,
    match: (p) => p.startsWith("/portfolio"),
  },
  {
    label: "New Team Member",
    eventName: CONTENT_CREATE_EVENTS.team,
    match: (p) => p.startsWith("/team"),
  },
  {
    label: "New Event",
    eventName: CONTENT_CREATE_EVENTS.event,
    match: (p) => p.startsWith("/events"),
  },
  {
    label: "New Property",
    eventName: CONTENT_CREATE_EVENTS.property,
    match: (p) => p.startsWith("/immobilien"),
  },
];

export function getContentCreateRoute(pathname: string) {
  return routes.find((route) => route.match(pathname)) ?? null;
}
