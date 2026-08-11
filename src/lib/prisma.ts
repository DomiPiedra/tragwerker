import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  /** Bump when schema field changes leave a stale Hot-reload singleton in memory. */
  prismaSchemaRevision: number | undefined;
};

/**
 * Increment when adding fields/models that older in-memory PrismaClient instances
 * won't know about (dev HMR keeps the previous singleton on globalThis).
 */
const PRISMA_SCHEMA_REVISION = 7;

/** Delegates from recent schema changes; stale dev singletons are recreated when any are missing. */
const REQUIRED_DELEGATES = [
  "contentOpen",
  "job",
  "portfolioItem",
  "analyticsConnection",
  "analyticsPageStat",
  "analyticsDailyStat",
] as const;

/** Field-level checks catch clients created before a migration's generate landed. */
const REQUIRED_MODEL_FIELDS: Record<string, string[]> = {
  Project: ["content", "heroImageUrl", "galleryUrls"],
  PortfolioItem: ["content", "heroImageUrl", "galleryUrls", "sortOrder", "details"],
  BlogPost: ["heroImageUrl", "galleryUrls"],
  Event: ["content", "heroImageUrl", "galleryUrls"],
  Property: ["content", "heroImageUrl", "galleryUrls"],
};

function hasRequiredDelegates(client: PrismaClient): boolean {
  return REQUIRED_DELEGATES.every((key) => key in client);
}

function getRuntimeModels(client: PrismaClient): Record<string, { fields?: Array<{ name?: string }> }> | null {
  const anyClient = client as unknown as {
    _runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name?: string }> }> };
    _engineConfig?: { runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name?: string }> }> } };
  };
  return (
    anyClient._runtimeDataModel?.models ??
    anyClient._engineConfig?.runtimeDataModel?.models ??
    null
  );
}

function hasRequiredModelFields(client: PrismaClient): boolean {
  const models = getRuntimeModels(client);
  if (!models) return true; // can't introspect — trust revision bump

  for (const [modelName, fields] of Object.entries(REQUIRED_MODEL_FIELDS)) {
    const model = models[modelName];
    if (!model?.fields) return false;
    const names = new Set(model.fields.map((f) => f.name).filter(Boolean));
    if (!fields.every((field) => names.has(field))) return false;
  }
  return true;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const revisionOk = globalForPrisma.prismaSchemaRevision === PRISMA_SCHEMA_REVISION;
  const schemaOk =
    Boolean(cached) && hasRequiredDelegates(cached!) && hasRequiredModelFields(cached!);

  if (cached && revisionOk && schemaOk) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaRevision = PRISMA_SCHEMA_REVISION;
  }
  return client;
}

/** Single Prisma instance per process (required in Next.js dev to avoid connection exhaustion). */
export const prisma = getPrismaClient();
