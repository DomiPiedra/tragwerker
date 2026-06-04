import { NextResponse } from "next/server";

import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const displayName = body.displayName?.trim() ?? "";
  const username = body.username?.trim() ?? "";
  const avatarUrlRaw = body.avatarUrl?.trim() ?? "";
  const avatarUrl = avatarUrlRaw.length > 0 ? avatarUrlRaw : null;
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!displayName || displayName.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Display name must be at least 2 characters." },
      { status: 400 }
    );
  }

  if (!username || username.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Username must be at least 3 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      username,
      NOT: { id: currentUser.id },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Username already exists." }, { status: 409 });
  }

  const updateData: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    passwordHash?: string;
  } = {
    displayName,
    username,
    avatarUrl,
  };

  if (newPassword.length > 0) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!currentPassword) {
      return NextResponse.json(
        { ok: false, error: "Current password is required to change password." },
        { status: 400 }
      );
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        passwordHash: true,
      },
    });
    if (!userWithPassword) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    let validPassword = await verifyPassword(currentPassword, userWithPassword.passwordHash);
    if (!validPassword && userWithPassword.passwordHash === currentPassword) {
      validPassword = true;
    }
    if (!validPassword) {
      return NextResponse.json(
        { ok: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    updateData.passwordHash = await hashPassword(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: updated,
  });
}
