import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateAnalyticsBriefAction } from "@/app/(dashboard)/analytics/actions";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAnalyticsBriefAction();
  return NextResponse.json(result);
}
