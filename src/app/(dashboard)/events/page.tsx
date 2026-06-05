import { prisma } from "@/lib/prisma";
import { EventsListClient } from "./events-list-client";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const eventIdRaw = resolvedSearchParams.eventId;
  const viewRaw = resolvedSearchParams.eventView;
  const initialFullViewEventId = Array.isArray(eventIdRaw) ? eventIdRaw[0] : eventIdRaw ?? null;
  const initialIsFullEventView = (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";

  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  const serialized = events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    location: event.location,
    description: event.description,
    published: event.published,
    publishedAt: event.publishedAt ? event.publishedAt.toISOString() : null,
    updatedAt: event.updatedAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
  }));

  return (
    <EventsListClient
      initialEvents={serialized}
      initialFullViewEventId={initialFullViewEventId}
      initialIsFullEventView={initialIsFullEventView}
    />
  );
}
