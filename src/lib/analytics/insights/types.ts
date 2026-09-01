import type { AttentionCard } from "@/lib/analytics/queries";
import type { ContentSeoEntityType } from "@/lib/seo/entity-types";

export type AnalyticsBriefContext = {
  quiet: Array<{ title: string; path: string; entityType: string | null; pageviews: number }>;
  rising: Array<{ title: string; delta: number; pageviews: number }>;
  falling: Array<{ title: string; delta: number; pageviews: number }>;
  landings: Array<{ title: string; entrances: number }>;
  exits: Array<{ title: string; exits: number; bounceRate: number }>;
};

export type AnalyticsBriefAction = {
  title: string;
  detail: string;
  entityTitle: string;
  entityType: ContentSeoEntityType | null;
  entityId: string | null;
  editHref: string | null;
};

export type AnalyticsBriefResult = {
  summary: string;
  actions: AnalyticsBriefAction[];
};

export interface AnalyticsInsightsProvider {
  generateBrief(context: AnalyticsBriefContext): Promise<AnalyticsBriefResult | null>;
}

export function briefActionsToAttentionCards(
  actions: AnalyticsBriefAction[]
): AttentionCard[] {
  return actions.map((action, i) => ({
    id: `ai-${action.entityId ?? i}`,
    kind: "ai" as const,
    title: action.title,
    reason: action.detail,
    entityType: action.entityType,
    entityId: action.entityId,
    editHref: action.editHref,
    priority: 90 - i,
  }));
}
