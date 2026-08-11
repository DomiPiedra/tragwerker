import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsOverview, getContentPerformance } from "@/lib/analytics/queries";
import { syncAnalytics } from "@/lib/analytics/sync";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "overview";

  if (view === "performance") {
    const entityType = searchParams.get("entityType") ?? undefined;
    const rows = await getContentPerformance({
      mappedOnly: true,
      ...(entityType ? { entityType } : {}),
    });
    return NextResponse.json({ rows });
  }

  const overview = await getAnalyticsOverview();
  return NextResponse.json({ overview });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { forceDemo?: boolean } = {};
  try {
    body = (await request.json()) as { forceDemo?: boolean };
  } catch {
    body = {};
  }

  const result = await syncAnalytics({ forceDemo: Boolean(body.forceDemo) });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
