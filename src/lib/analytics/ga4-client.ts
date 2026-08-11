import { getValidAccessToken } from "@/lib/analytics/google-oauth";

export type Ga4DateRange = { startDate: string; endDate: string };

export type Ga4PageRow = {
  path: string;
  pageviews: number;
  sessions: number;
  users: number;
  avgEngagementSec: number;
  bounceRate: number;
  entrances: number;
  exits: number;
};

export type Ga4DailyRow = {
  date: string; // YYYYMMDD
  sessions: number;
  users: number;
  pageviews: number;
  engagementRate: number;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

function num(v: string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function runReport(
  propertyId: string,
  body: Record<string, unknown>
): Promise<RunReportResponse> {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Not connected to Google Analytics.");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 report failed: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as RunReportResponse;
}

export async function fetchPagePathReport(
  propertyId: string,
  range: Ga4DateRange
): Promise<Ga4PageRow[]> {
  const data = await runReport(propertyId, {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
      { name: "engagedSessions" },
    ],
    limit: 500,
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
  });

  return (data.rows ?? []).map((row) => {
    const pageviews = num(row.metricValues?.[0]?.value);
    const sessions = num(row.metricValues?.[1]?.value);
    const engaged = num(row.metricValues?.[5]?.value);
    return {
      path: row.dimensionValues?.[0]?.value ?? "/",
      pageviews,
      sessions,
      users: num(row.metricValues?.[2]?.value),
      avgEngagementSec: num(row.metricValues?.[3]?.value),
      bounceRate: num(row.metricValues?.[4]?.value),
      // Proxy: treat engaged share as entrance strength; exits ≈ non-engaged
      entrances: Math.round(engaged || sessions * 0.4),
      exits: Math.max(0, Math.round(sessions - engaged)),
    };
  });
}

export async function fetchDailyReport(
  propertyId: string,
  range: Ga4DateRange
): Promise<Ga4DailyRow[]> {
  const data = await runReport(propertyId, {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
  });

  return (data.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    sessions: num(row.metricValues?.[0]?.value),
    users: num(row.metricValues?.[1]?.value),
    pageviews: num(row.metricValues?.[2]?.value),
    engagementRate: num(row.metricValues?.[3]?.value),
  }));
}

/** Format Date as GA4 YYYY-MM-DD. */
export function toGa4Date(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function parseGa4Date(yyyymmdd: string): Date {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6)) - 1;
  const day = Number(yyyymmdd.slice(6, 8));
  return new Date(Date.UTC(y, m, day));
}
