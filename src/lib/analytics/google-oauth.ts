import { encryptSecret, decryptSecret } from "@/lib/analytics/crypto";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "openid",
  "email",
].join(" ");

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function getGoogleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/analytics/google/callback"
  );
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured.");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as TokenResponse;
}

function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
    };
    return json.email ?? null;
  } catch {
    return null;
  }
}

/** Ensure a singleton connection row exists. */
export async function getOrCreateAnalyticsConnection() {
  const existing = await prisma.analyticsConnection.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.analyticsConnection.create({ data: {} });
}

export async function saveOAuthTokens(tokens: TokenResponse) {
  const connection = await getOrCreateAnalyticsConnection();
  const email = emailFromIdToken(tokens.id_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  return prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: {
      googleAccountEmail: email ?? connection.googleAccountEmail,
      accessTokenEnc: encryptSecret(tokens.access_token),
      accessTokenExpiresAt: expiresAt,
      ...(tokens.refresh_token
        ? { refreshTokenEnc: encryptSecret(tokens.refresh_token) }
        : {}),
    },
  });
}

/** Return a valid access token, refreshing if needed. */
export async function getValidAccessToken(): Promise<string | null> {
  const connection = await prisma.analyticsConnection.findFirst({ orderBy: { createdAt: "asc" } });
  if (!connection?.refreshTokenEnc && !connection?.accessTokenEnc) return null;

  const stillValid =
    connection.accessTokenEnc &&
    connection.accessTokenExpiresAt &&
    connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000;

  if (stillValid && connection.accessTokenEnc) {
    return decryptSecret(connection.accessTokenEnc);
  }

  if (!connection.refreshTokenEnc) return null;
  const refreshToken = decryptSecret(connection.refreshTokenEnc);
  const tokens = await refreshAccessToken(refreshToken);
  await prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: encryptSecret(tokens.access_token),
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

export async function disconnectGoogleAnalytics() {
  const connection = await prisma.analyticsConnection.findFirst({ orderBy: { createdAt: "asc" } });
  if (!connection) return;
  await prisma.analyticsConnection.update({
    where: { id: connection.id },
    data: {
      googleAccountEmail: null,
      propertyId: null,
      propertyDisplayName: null,
      refreshTokenEnc: null,
      accessTokenEnc: null,
      accessTokenExpiresAt: null,
      lastSyncAt: null,
      lastBriefJson: null,
      lastBriefAt: null,
    },
  });
}

export type Ga4PropertyOption = {
  propertyId: string;
  displayName: string;
  accountName: string;
};

export async function listGa4Properties(): Promise<Ga4PropertyOption[]> {
  const token = await getValidAccessToken();
  if (!token) return [];

  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list GA4 properties: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    accountSummaries?: Array<{
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  };

  const options: Ga4PropertyOption[] = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      const raw = prop.property ?? "";
      const propertyId = raw.replace(/^properties\//, "");
      if (!propertyId) continue;
      options.push({
        propertyId,
        displayName: prop.displayName ?? propertyId,
        accountName: account.displayName ?? "Account",
      });
    }
  }
  return options;
}
