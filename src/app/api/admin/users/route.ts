import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";

import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (currentUser.role !== UserRole.admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    username?: string;
    displayName?: string;
    password?: string;
    role?: string;
  };

  const username = body.username?.trim() ?? "";
  const displayName = body.displayName?.trim() || username;
  const password = body.password ?? "";
  const role = body.role === UserRole.admin ? UserRole.admin : UserRole.editor;

  if (!username || username.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Username must be at least 3 characters." },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Username already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash: await hashPassword(password),
      role,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
