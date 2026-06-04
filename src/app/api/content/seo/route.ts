import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { contentSeoRefSchema, contentSeoSchema } from "@/lib/seo";
import { ensureContentSeo, getContentSeo, upsertContentSeo } from "@/lib/seo/server";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = contentSeoRefSchema.safeParse({
    entityType: searchParams.get("entityType"),
    entityId: searchParams.get("entityId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entity reference" }, { status: 400 });
  }

  const record = await getContentSeo(parsed.data);
  return NextResponse.json({ seo: record });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as {
    entityType?: string;
    entityId?: string;
    seo?: unknown;
  };

  const refParsed = contentSeoRefSchema.safeParse({
    entityType: payload.entityType,
    entityId: payload.entityId,
  });
  if (!refParsed.success) {
    return NextResponse.json({ error: "Invalid entity reference" }, { status: 400 });
  }

  const seoParsed = contentSeoSchema.safeParse(payload.seo ?? {});
  if (!seoParsed.success) {
    return NextResponse.json({ error: "Invalid SEO payload" }, { status: 400 });
  }

  const record = await upsertContentSeo(refParsed.data, seoParsed.data);
  return NextResponse.json({ seo: record });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contentSeoRefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entity reference" }, { status: 400 });
  }

  const record = await ensureContentSeo(parsed.data);
  return NextResponse.json({ seo: record });
}
