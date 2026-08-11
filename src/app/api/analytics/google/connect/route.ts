import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import {
  buildGoogleAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/analytics/google-oauth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env" },
      { status: 400 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ga_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = buildGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
