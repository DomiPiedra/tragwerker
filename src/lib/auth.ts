import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "hcms_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function cookieExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function isUnknownAvatarFieldError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Unknown field `avatarUrl`") ||
      error.message.includes("Unknown argument `avatarUrl`"))
  );
}

function getUserDelegate() {
  return (prisma as unknown as {
    user?: {
      count: () => Promise<number>;
      create: (args: {
        data: {
          username: string;
          displayName: string;
          role: UserRole;
          passwordHash: string;
        };
      }) => Promise<{ id: string }>;
      findUnique: (args: {
        where: { username: string };
      }) => Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        role: UserRole;
        passwordHash: string;
      } | null>;
    };
  }).user;
}

function getSessionDelegate() {
  return (prisma as unknown as {
    authSession?: {
      create: (args: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => Promise<unknown>;
      deleteMany: (args: { where: { tokenHash: string } }) => Promise<unknown>;
      findUnique: (args: {
        where: { tokenHash: string };
        include: {
          user: {
            select: {
              id: true;
              username: true;
              displayName: true;
              avatarUrl: true;
              role: true;
            };
          };
        };
      }) => Promise<{
        tokenHash: string;
        expiresAt: Date;
        user: AuthUser;
      } | null>;
      delete: (args: { where: { tokenHash: string } }) => Promise<unknown>;
    };
  }).authSession;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function ensureBootstrapAdmin() {
  const userDelegate = getUserDelegate();
  if (!userDelegate) {
    throw new Error(
      "Auth schema is not ready. Run `npx prisma migrate dev` and restart the dev server."
    );
  }

  const userCount = await userDelegate.count();
  if (userCount > 0) return;

  const username = process.env.AUTH_BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const displayName = process.env.AUTH_BOOTSTRAP_ADMIN_DISPLAY_NAME?.trim() || "Admin";

  if (!username || !password) return;

  await userDelegate.create({
    data: {
      username,
      displayName,
      avatarUrl: null,
      role: UserRole.admin,
      passwordHash: await hashPassword(password),
    },
  });
}

export async function createSessionForUser(userId: string): Promise<void> {
  const sessionDelegate = getSessionDelegate();
  if (!sessionDelegate) {
    throw new Error(
      "Auth schema is not ready. Run `npx prisma migrate dev` and restart the dev server."
    );
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = cookieExpiresAt();

  await sessionDelegate.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const sessionDelegate = getSessionDelegate();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawToken && sessionDelegate) {
    await sessionDelegate.deleteMany({
      where: { tokenHash: sha256Hex(rawToken) },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionDelegate = getSessionDelegate();
  if (!sessionDelegate) return null;

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  let session: {
    tokenHash: string;
    expiresAt: Date;
    user: AuthUser;
  } | null = null;

  try {
    session = await sessionDelegate.findUnique({
      where: { tokenHash: sha256Hex(rawToken) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isUnknownAvatarFieldError(error)) throw error;
    const fallback = await (prisma as unknown as {
      authSession: {
        findUnique: (args: {
          where: { tokenHash: string };
          include: {
            user: {
              select: {
                id: true;
                username: true;
                displayName: true;
                role: true;
              };
            };
          };
        }) => Promise<{
          tokenHash: string;
          expiresAt: Date;
          user: {
            id: string;
            username: string;
            displayName: string;
            role: UserRole;
          };
        } | null>;
      };
    }).authSession.findUnique({
      where: { tokenHash: sha256Hex(rawToken) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
      },
    });
    session = fallback
      ? {
          tokenHash: fallback.tokenHash,
          expiresAt: fallback.expiresAt,
          user: {
            ...fallback.user,
            avatarUrl: null,
          },
        }
      : null;
  }
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await sessionDelegate.delete({ where: { tokenHash: session.tokenHash } });
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireEditorOrAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== UserRole.admin && user.role !== UserRole.editor) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== UserRole.admin) {
    redirect("/cms");
  }
  return user;
}

export async function findUserByUsername(username: string) {
  const userDelegate = getUserDelegate();
  if (!userDelegate) {
    throw new Error(
      "Auth schema is not ready. Run `npx prisma migrate dev` and restart the dev server."
    );
  }
  const exact = await prisma.user.findUnique({ where: { username } });
  if (exact) return exact;
  return prisma.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
    },
  });
}

export async function updateUserPasswordHash(userId: string, passwordHash: string) {
  const userDelegate = getUserDelegate();
  if (!userDelegate) {
    throw new Error(
      "Auth schema is not ready. Run `npx prisma migrate dev` and restart the dev server."
    );
  }
  await (prisma as unknown as {
    user: {
      update: (args: { where: { id: string }; data: { passwordHash: string } }) => Promise<unknown>;
    };
  }).user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
