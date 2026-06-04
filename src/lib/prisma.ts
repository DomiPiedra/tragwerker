import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Delegate added with ContentOpen; used to detect a stale singleton after schema changes in dev. */
const REQUIRED_DELEGATE = "contentOpen" as const;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && REQUIRED_DELEGATE in cached) {
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
