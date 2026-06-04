import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function logActivity(input: {
  entityType: string;
  entityId: string;
  action: string;
  title: string;
  details?: string;
}) {
  const user = await getCurrentUser();

  await prisma.activityLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      title: input.title,
      details: input.details ?? null,
      userId: user?.id ?? null,
    },
  });
}

export function activityEntityHref(entityType: string, entityId: string): string {
  const id = encodeURIComponent(entityId);
  switch (entityType) {
    case "project":
      return `/projects?projectId=${id}&projectView=full`;
    case "portfolioItem":
      return `/portfolio?itemId=${id}&portfolioView=full`;
    case "blogPost":
      return `/blog?postId=${id}&blogView=full`;
    case "teamMember":
      return `/team?memberId=${id}&teamView=full`;
    case "event":
      return `/events?eventId=${id}&eventView=full`;
    case "property":
      return `/immobilien?propertyId=${id}&propertyView=full`;
    default:
      return "/";
  }
}
