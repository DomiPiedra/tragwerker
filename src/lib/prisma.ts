import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Delegates from recent schema changes; stale dev singletons are recreated when any are missing. */
const REQUIRED_DELEGATES = ["contentOpen", "job"] as const;

function hasRequiredDelegates(client: PrismaClient): boolean {
  return REQUIRED_DELEGATES.every((key) => key in client);
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && hasRequiredDelegates(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Single Prisma instance per process (required in Next.js dev to avoid connection exhaustion). */
export const prisma = getPrismaClient();
