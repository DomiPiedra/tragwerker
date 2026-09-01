"use server";

import { requireAdmin, requireUser } from "@/lib/auth";
import {
  buildRuleBasedAttentionQueue,
  getAnalyticsConnectionStatus,
  getAnalyticsOverview,
  getContentPerformance,
  getStoredAnalyticsBrief,
  type AttentionCard,
} from "@/lib/analytics/queries";
import {
  briefActionsToAttentionCards,
  type AnalyticsBriefContext,
} from "@/lib/analytics/insights/types";
import {
  getAnalyticsInsightsProvider,
  resolveBriefEditLinks,
} from "@/lib/analytics/insights/provider";
import {
  disconnectGoogleAnalytics,
  getOrCreateAnalyticsConnection,
  isGoogleOAuthConfigured,
  listGa4Properties,
} from "@/lib/analytics/google-oauth";
import { syncAnalytics } from "@/lib/analytics/sync";
import { prisma } from "@/lib/prisma";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

export async function getAnalyticsOverviewAction() {
  await requireUser();
  return getAnalyticsOverview();
}

export async function getContentPerformanceAction(entityType?: string) {
  await requireUser();
  return getContentPerformance({
    mappedOnly: true,
    ...(entityType ? { entityType } : {}),
  });
}

export async function getAttentionQueueAction() {
  await requireUser();
  const [rules, brief] = await Promise.all([
    buildRuleBasedAttentionQueue(),
    getStoredAnalyticsBrief(),
  ]);
  const aiCards = brief?.actions ?? [];
  // Prefer AI cards first, then fill with rules not already covered
  const seen = new Set(aiCards.map((c) => c.entityId).filter(Boolean));
  const merged: AttentionCard[] = [
    ...aiCards,
    ...rules.filter((r) => !r.entityId || !seen.has(r.entityId)),
  ];
  return {
    cards: merged.slice(0, 12),
    briefSummary: brief?.summary ?? null,
    briefGeneratedAt: brief?.generatedAt ?? null,
  };
}

export async function syncAnalyticsAction(forceDemo?: boolean) {
  await requireUser();
  return syncAnalytics({ forceDemo: Boolean(forceDemo) });
}

export async function getAnalyticsConnectionAction() {
  await requireUser();
  return getAnalyticsConnectionStatus();
}

export async function listGa4PropertiesAction() {
  await requireAdmin();
  if (!isGoogleOAuthConfigured()) {
    return { ok: false as const, error: "Google OAuth is not configured.", properties: [] };
  }
  try {
    const properties = await listGa4Properties();
    return { ok: true as const, properties };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to list properties",
      properties: [],
    };
  }
}

export async function selectGa4PropertyAction(propertyId: string, displayName: string) {
  await requireAdmin();
  const connection = await getOrCreateAnalyticsConnection();
  await prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: {
      propertyId: propertyId.replace(/^properties\//, ""),
      propertyDisplayName: displayName,
    },
  });
  return { ok: true as const };
}

export async function disconnectAnalyticsAction() {
  await requireAdmin();
  await disconnectGoogleAnalytics();
  return { ok: true as const };
}

export async function generateAnalyticsBriefAction() {
  await requireUser();

  const performance = await getContentPerformance({ mappedOnly: true });
  const quiet = performance
    .filter((r) => r.pageviews <= 2)
    .slice(0, 8)
    .map((r) => ({
      title: r.title,
      path: r.path,
      entityType: r.entityType,
      pageviews: r.pageviews,
    }));
  const rising = [...performance]
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 6)
    .map((r) => ({ title: r.title, delta: r.delta, pageviews: r.pageviews }));
  const falling = [...performance]
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 6)
    .map((r) => ({ title: r.title, delta: r.delta, pageviews: r.pageviews }));
  const landings = [...performance]
    .sort((a, b) => b.entrances - a.entrances)
    .slice(0, 5)
    .map((r) => ({ title: r.title, entrances: r.entrances }));
  const exits = [...performance]
    .sort((a, b) => b.exits - a.exits)
    .slice(0, 5)
    .map((r) => ({ title: r.title, exits: r.exits, bounceRate: r.bounceRate }));

  const context: AnalyticsBriefContext = { quiet, rising, falling, landings, exits };
  const provider = getAnalyticsInsightsProvider();
  let brief = await provider.generateBrief(context);

  if (!brief) {
    // Rule-based fallback brief when AI is unavailable
    const rules = await buildRuleBasedAttentionQueue();
    brief = {
      summary:
        "AI brief unavailable — showing rule-based priorities from quiet pages, movers, and exit signals.",
      actions: rules.slice(0, 5).map((c) => ({
        title: c.title,
        detail: c.reason,
        entityTitle: c.title,
        entityType: c.entityType,
        entityId: c.entityId,
        editHref: c.editHref,
      })),
    };
  } else {
    const catalog = performance
      .filter((r): r is typeof r & { entityType: ContentSeoEntityType; entityId: string } =>
        Boolean(r.entityType && r.entityId)
      )
      .map((r) => ({
        title: r.title,
        entityType: r.entityType,
        entityId: r.entityId,
      }));
    brief = resolveBriefEditLinks(brief, catalog);
  }

  const actions = briefActionsToAttentionCards(
    brief.actions.map((a) => ({
      ...a,
      entityType: a.entityType,
      entityId: a.entityId,
      editHref: a.editHref,
    }))
  );

  const connection = await getOrCreateAnalyticsConnection();
  await prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: {
      lastBriefJson: JSON.stringify({ summary: brief.summary, actions }),
      lastBriefAt: new Date(),
    },
  });

  return {
    ok: true as const,
    summary: brief.summary,
    actions,
  };
}
