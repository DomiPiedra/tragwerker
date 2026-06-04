import { NextResponse } from "next/server";

import {
  CONTENT_ENTITY_TYPES,
  recordContentOpen,
  type ContentEntityType,
} from "@/lib/content-open";

export async function POST(request: Request) {
  let body: { entityType?: string; entityId?: string };
  try {
    body = (await request.json()) as { entityType?: string; entityId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entityType = body.entityType?.trim();
  const entityId = body.entityId?.trim();

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!CONTENT_ENTITY_TYPES.includes(entityType as ContentEntityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  const result = await recordContentOpen({
    entityType: entityType as ContentEntityType,
    entityId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
