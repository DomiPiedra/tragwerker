import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import {
  exchangeCodeForTokens,
  saveOAuthTokens,
} from "@/lib/analytics/google-oauth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.admin) {
    return NextResponse.redirect(new URL("/settings?section=integrations&error=auth", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/settings?section=integrations&error=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const expected = cookieStore.get("ga_oauth_state")?.value;
  cookieStore.delete("ga_oauth_state");

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(
      new URL("/settings?section=integrations&error=state", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveOAuthTokens(tokens);
    return NextResponse.redirect(
      new URL("/settings?section=integrations&connected=1", request.url)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "token";
    return NextResponse.redirect(
      new URL(`/settings?section=integrations&error=${encodeURIComponent(msg.slice(0, 80))}`, request.url)
    );
  }
}
