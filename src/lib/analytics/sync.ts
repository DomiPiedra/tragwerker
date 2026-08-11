import type { ContentSeoEntityType } from "@/lib/seo/entity-types";
import { matchPathToEntity, normalizeAnalyticsPath } from "@/lib/analytics/map-path";
import {
  daysAgo,
  fetchDailyReport,
  fetchPagePathReport,
  parseGa4Date,
  toGa4Date,
  type Ga4PageRow,
} from "@/lib/analytics/ga4-client";
import { getOrCreateAnalyticsConnection } from "@/lib/analytics/google-oauth";
import { prisma } from "@/lib/prisma";

async function buildSlugIndex(): Promise<
  Map<string, { entityType: ContentSeoEntityType; entityId: string; title: string }>
> {
  const index = new Map<
    string,
    { entityType: ContentSeoEntityType; entityId: string; title: string }
  >();

  const [pages, posts, projects, services, portfolio, events, properties, jobs] =
    await Promise.all([
      prisma.page.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.blogPost.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.project.findMany({ select: { id: true, slug: true, name: true } }),
      prisma.service.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.portfolioItem.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.event.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.property.findMany({ select: { id: true, slug: true, title: true } }),
      prisma.job.findMany({ select: { id: true, slug: true, title: true } }),
    ]);

  const add = (
    entityType: ContentSeoEntityType,
    rows: Array<{ id: string; slug: string; title: string }>
  ) => {
    for (const row of rows) {
      index.set(`${entityType}:${row.slug}`, {
        entityType,
        entityId: row.id,
        title: row.title,
      });
    }
  };

  add("page", pages);
  add("blogPost", posts);
  add(
    "project",
    projects.map((p) => ({ id: p.id, slug: p.slug, title: p.name }))
  );
  add("service", services);
  add("portfolioItem", portfolio);
  add("event", events);
  add("property", properties);
  add("job", jobs);

  return index;
}

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function upsertPageStats(
  rows: Ga4PageRow[],
  prevByPath: Map<string, number>,
  dateFrom: Date,
  dateTo: Date,
  slugIndex: Map<string, { entityType: ContentSeoEntityType; entityId: string; title: string }>
) {
  for (const row of rows) {
    const path = normalizeAnalyticsPath(row.path);
    const mapped = matchPathToEntity(path, slugIndex);
    await prisma.analyticsPageStat.upsert({
      where: {
        path_dateFrom_dateTo: { path, dateFrom, dateTo },
      },
      create: {
        path,
        dateFrom,
        dateTo,
        pageviews: row.pageviews,
        sessions: row.sessions,
        users: row.users,
        avgEngagementSec: row.avgEngagementSec,
        bounceRate: row.bounceRate,
        entrances: row.entrances,
        exits: row.exits,
        entityType: mapped?.entityType ?? null,
        entityId: mapped?.entityId ?? null,
        entityTitle: mapped?.entityTitle ?? null,
        pageviewsPrev: prevByPath.get(path) ?? 0,
      },
      update: {
        pageviews: row.pageviews,
        sessions: row.sessions,
        users: row.users,
        avgEngagementSec: row.avgEngagementSec,
        bounceRate: row.bounceRate,
        entrances: row.entrances,
        exits: row.exits,
        entityType: mapped?.entityType ?? null,
        entityId: mapped?.entityId ?? null,
        entityTitle: mapped?.entityTitle ?? null,
        pageviewsPrev: prevByPath.get(path) ?? 0,
      },
    });
  }
}

/** Seed plausible demo stats from published CMS content when GA is not connected. */
export async function seedDemoAnalyticsStats(): Promise<{ seeded: number }> {
  const slugIndex = await buildSlugIndex();
  const dateTo = dateOnly(daysAgo(0));
  const dateFrom = dateOnly(daysAgo(7));

  await prisma.analyticsPageStat.deleteMany({
    where: { dateFrom, dateTo },
  });

  const pathMap: Record<string, string> = {
    page: "pages",
    blogPost: "blog",
    project: "projects",
    service: "services",
    portfolioItem: "portfolio",
    event: "events",
    property: "immobilien",
    job: "jobs",
  };

  let seeded = 0;
  const entries = Array.from(slugIndex.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, meta] = entries[i]!;
    const slug = key.slice(key.indexOf(":") + 1);
    const path = `/${pathMap[meta.entityType] ?? "pages"}/${slug}`;
    const pageviews = Math.max(0, Math.round(80 - i * 3 + ((i * 17) % 23)));
    const prev = Math.max(0, Math.round(pageviews * (0.6 + ((i % 5) * 0.15))));
    await prisma.analyticsPageStat.create({
      data: {
        path,
        dateFrom,
        dateTo,
        pageviews,
        sessions: Math.round(pageviews * 0.85),
        users: Math.round(pageviews * 0.7),
        avgEngagementSec: 40 + (i % 90),
        bounceRate: 0.2 + (i % 10) * 0.04,
        entrances: Math.round(pageviews * 0.4),
        exits: Math.round(pageviews * 0.35),
        entityType: meta.entityType,
        entityId: meta.entityId,
        entityTitle: meta.title,
        pageviewsPrev: prev,
      },
    });
    seeded++;
  }

  // Daily sparkline last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = dateOnly(daysAgo(i));
    const sessions = 40 + (13 - i) * 3 + (i % 7) * 5;
    await prisma.analyticsDailyStat.upsert({
      where: { date: d },
      create: {
        date: d,
        sessions,
        users: Math.round(sessions * 0.8),
        pageviews: Math.round(sessions * 1.6),
        engagementRate: 0.45 + (i % 5) * 0.04,
      },
      update: {
        sessions,
        users: Math.round(sessions * 0.8),
        pageviews: Math.round(sessions * 1.6),
        engagementRate: 0.45 + (i % 5) * 0.04,
      },
    });
  }

  const connection = await getOrCreateAnalyticsConnection();
  await prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: { lastSyncAt: new Date() },
  });

  return { seeded };
}

export type SyncAnalyticsResult = {
  ok: boolean;
  mode: "ga4" | "demo";
  pageRows: number;
  error?: string;
};

export async function syncAnalytics(options?: {
  forceDemo?: boolean;
}): Promise<SyncAnalyticsResult> {
  const connection = await getOrCreateAnalyticsConnection();
  const useDemo = options?.forceDemo || !connection.propertyId || !connection.refreshTokenEnc;

  if (useDemo) {
    const { seeded } = await seedDemoAnalyticsStats();
    return { ok: true, mode: "demo", pageRows: seeded };
  }

  try {
    const propertyId = connection.propertyId!;
    const dateTo = dateOnly(daysAgo(0));
    const dateFrom = dateOnly(daysAgo(7));
    const prevFrom = dateOnly(daysAgo(14));
    const prevTo = dateOnly(daysAgo(8));

    const [current, previous, daily] = await Promise.all([
      fetchPagePathReport(propertyId, {
        startDate: toGa4Date(dateFrom),
        endDate: toGa4Date(dateTo),
      }),
      fetchPagePathReport(propertyId, {
        startDate: toGa4Date(prevFrom),
        endDate: toGa4Date(prevTo),
      }),
      fetchDailyReport(propertyId, {
        startDate: toGa4Date(daysAgo(27)),
        endDate: toGa4Date(dateTo),
      }),
    ]);

    const prevByPath = new Map<string, number>();
    for (const row of previous) {
      prevByPath.set(normalizeAnalyticsPath(row.path), row.pageviews);
    }

    const slugIndex = await buildSlugIndex();

    await prisma.analyticsPageStat.deleteMany({ where: { dateFrom, dateTo } });
    await upsertPageStats(current, prevByPath, dateFrom, dateTo, slugIndex);

    for (const row of daily) {
      if (!row.date) continue;
      const d = dateOnly(parseGa4Date(row.date));
      await prisma.analyticsDailyStat.upsert({
        where: { date: d },
        create: {
          date: d,
          sessions: row.sessions,
          users: row.users,
          pageviews: row.pageviews,
          engagementRate: row.engagementRate,
        },
        update: {
          sessions: row.sessions,
          users: row.users,
          pageviews: row.pageviews,
          engagementRate: row.engagementRate,
        },
      });
    }

    await prisma.analyticsConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    return { ok: true, mode: "ga4", pageRows: current.length };
  } catch (err) {
    return {
      ok: false,
      mode: "ga4",
      pageRows: 0,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
