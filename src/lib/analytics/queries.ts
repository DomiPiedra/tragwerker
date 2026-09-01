import { editorDeepLink } from "@/lib/analytics/map-path";
import { daysAgo } from "@/lib/analytics/ga4-client";
import { prisma } from "@/lib/prisma";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export type AnalyticsConnectionStatus = {
  connected: boolean;
  oauthConfigured: boolean;
  googleAccountEmail: string | null;
  propertyId: string | null;
  propertyDisplayName: string | null;
  lastSyncAt: string | null;
  lastBriefAt: string | null;
  hasBrief: boolean;
};

export type AnalyticsOverview = {
  sessions7d: number;
  users7d: number;
  pageviews7d: number;
  engagementRate7d: number;
  sessionsPrev7d: number;
  usersPrev7d: number;
  pageviewsPrev7d: number;
  sparkline: Array<{ date: string; sessions: number; users: number; pageviews: number }>;
  connection: AnalyticsConnectionStatus;
};

export type ContentPerformanceRow = {
  path: string;
  entityType: ContentSeoEntityType | null;
  entityId: string | null;
  title: string;
  pageviews: number;
  pageviewsPrev: number;
  delta: number;
  sessions: number;
  avgEngagementSec: number;
  bounceRate: number;
  entrances: number;
  exits: number;
  editHref: string | null;
};

export type AttentionCard = {
  id: string;
  kind: "quiet" | "rising" | "falling" | "landing" | "exit" | "ai";
  title: string;
  reason: string;
  entityType: ContentSeoEntityType | null;
  entityId: string | null;
  editHref: string | null;
  priority: number;
};

async function latestWindow() {
  const dateTo = dateOnly(daysAgo(0));
  const dateFrom = dateOnly(daysAgo(7));
  return { dateFrom, dateTo };
}

export async function getAnalyticsConnectionStatus(): Promise<AnalyticsConnectionStatus> {
  const connection = await prisma.analyticsConnection.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const oauthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  return {
    connected: Boolean(connection?.refreshTokenEnc),
    oauthConfigured,
    googleAccountEmail: connection?.googleAccountEmail ?? null,
    propertyId: connection?.propertyId ?? null,
    propertyDisplayName: connection?.propertyDisplayName ?? null,
    lastSyncAt: connection?.lastSyncAt?.toISOString() ?? null,
    lastBriefAt: connection?.lastBriefAt?.toISOString() ?? null,
    hasBrief: Boolean(connection?.lastBriefJson),
  };
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const connection = await getAnalyticsConnectionStatus();
  const since = dateOnly(daysAgo(13));
  const daily = await prisma.analyticsDailyStat.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const last7 = daily.slice(-7);
  const prev7 = daily.slice(0, Math.max(0, daily.length - 7)).slice(-7);

  const sum = (rows: typeof daily, key: "sessions" | "users" | "pageviews") =>
    rows.reduce((acc, r) => acc + r[key], 0);
  const avgEng = (rows: typeof daily) =>
    rows.length === 0 ? 0 : rows.reduce((a, r) => a + r.engagementRate, 0) / rows.length;

  return {
    sessions7d: sum(last7, "sessions"),
    users7d: sum(last7, "users"),
    pageviews7d: sum(last7, "pageviews"),
    engagementRate7d: avgEng(last7),
    sessionsPrev7d: sum(prev7, "sessions"),
    usersPrev7d: sum(prev7, "users"),
    pageviewsPrev7d: sum(prev7, "pageviews"),
    sparkline: daily.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      sessions: d.sessions,
      users: d.users,
      pageviews: d.pageviews,
    })),
    connection,
  };
}

export async function getContentPerformance(options?: {
  entityType?: string;
  mappedOnly?: boolean;
}): Promise<ContentPerformanceRow[]> {
  const { dateFrom, dateTo } = await latestWindow();
  const rows = await prisma.analyticsPageStat.findMany({
    where: {
      dateFrom,
      dateTo,
      ...(options?.entityType ? { entityType: options.entityType } : {}),
      ...(options?.mappedOnly ? { entityId: { not: null } } : {}),
    },
    orderBy: { pageviews: "desc" },
    take: 200,
  });

  return rows.map((row) => {
    const entityType = (row.entityType as ContentSeoEntityType | null) ?? null;
    const editHref =
      entityType && row.entityId ? editorDeepLink(entityType, row.entityId) : null;
    return {
      path: row.path,
      entityType,
      entityId: row.entityId,
      title: row.entityTitle ?? row.path,
      pageviews: row.pageviews,
      pageviewsPrev: row.pageviewsPrev,
      delta: row.pageviews - row.pageviewsPrev,
      sessions: row.sessions,
      avgEngagementSec: row.avgEngagementSec,
      bounceRate: row.bounceRate,
      entrances: row.entrances,
      exits: row.exits,
      editHref,
    };
  });
}

export async function buildRuleBasedAttentionQueue(): Promise<AttentionCard[]> {
  const rows = await getContentPerformance({ mappedOnly: true });
  const cards: AttentionCard[] = [];

  const quiet = rows
    .filter((r) => r.pageviews <= 2 && r.entityId)
    .slice(0, 5);
  for (const r of quiet) {
    cards.push({
      id: `quiet-${r.entityId}`,
      kind: "quiet",
      title: r.title,
      reason: "Published content with almost no traffic in the last 7 days. Refresh the intro or promote it.",
      entityType: r.entityType,
      entityId: r.entityId,
      editHref: r.editHref,
      priority: 40,
    });
  }

  const rising = [...rows]
    .filter((r) => r.delta >= 10 && r.entityId)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4);
  for (const r of rising) {
    cards.push({
      id: `rising-${r.entityId}`,
      kind: "rising",
      title: r.title,
      reason: `Up ${r.delta} pageviews vs prior week. Double down — update CTA or related links.`,
      entityType: r.entityType,
      entityId: r.entityId,
      editHref: r.editHref,
      priority: 70 + Math.min(20, r.delta),
    });
  }

  const falling = [...rows]
    .filter((r) => r.delta <= -10 && r.entityId)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 4);
  for (const r of falling) {
    cards.push({
      id: `falling-${r.entityId}`,
      kind: "falling",
      title: r.title,
      reason: `Down ${Math.abs(r.delta)} pageviews vs prior week. Check headline, hero, and SEO title.`,
      entityType: r.entityType,
      entityId: r.entityId,
      editHref: r.editHref,
      priority: 60 + Math.min(20, Math.abs(r.delta)),
    });
  }

  const landings = [...rows]
    .filter((r) => r.entrances >= 5 && r.entityId)
    .sort((a, b) => b.entrances - a.entrances)
    .slice(0, 3);
  for (const r of landings) {
    cards.push({
      id: `landing-${r.entityId}`,
      kind: "landing",
      title: r.title,
      reason: `Top landing page (${r.entrances} entrances). Polish the first screen and primary CTA.`,
      entityType: r.entityType,
      entityId: r.entityId,
      editHref: r.editHref,
      priority: 55,
    });
  }

  const exits = [...rows]
    .filter((r) => r.exits >= 5 && r.bounceRate >= 0.5 && r.entityId)
    .sort((a, b) => b.exits - a.exits)
    .slice(0, 3);
  for (const r of exits) {
    cards.push({
      id: `exit-${r.entityId}`,
      kind: "exit",
      title: r.title,
      reason: `High exits (${r.exits}) with weak engagement. Tighten copy or clarify next step.`,
      entityType: r.entityType,
      entityId: r.entityId,
      editHref: r.editHref,
      priority: 50,
    });
  }

  // Dedupe by entityId keeping highest priority
  const byEntity = new Map<string, AttentionCard>();
  for (const card of cards) {
    const key = card.entityId ?? card.id;
    const prev = byEntity.get(key);
    if (!prev || card.priority > prev.priority) byEntity.set(key, card);
  }

  return Array.from(byEntity.values()).sort((a, b) => b.priority - a.priority).slice(0, 12);
}

export async function getStoredAnalyticsBrief(): Promise<{
  summary: string;
  actions: AttentionCard[];
  generatedAt: string | null;
} | null> {
  const connection = await prisma.analyticsConnection.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!connection?.lastBriefJson) return null;
  try {
    const parsed = JSON.parse(connection.lastBriefJson) as {
      summary: string;
      actions: AttentionCard[];
    };
    return {
      summary: parsed.summary,
      actions: parsed.actions ?? [],
      generatedAt: connection.lastBriefAt?.toISOString() ?? null,
    };
  } catch {
    return null;
  }
}
