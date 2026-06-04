import { NextResponse } from "next/server";

import { createSemanticRouter } from "@/lib/ai";
import type { SemanticRouterRequest } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ suggestion: null }, { status: 401 });
    }
    const body = (await request.json()) as SemanticRouterRequest;
    if (!body?.input || !Array.isArray(body?.commands)) {
      return NextResponse.json({ suggestion: null }, { status: 400 });
    }

    const router = createSemanticRouter();
    const result = await router.route({
      input: body.input,
      commands: body.commands,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ suggestion: null }, { status: 200 });
  }
}
