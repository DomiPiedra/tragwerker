-- CreateTable
CREATE TABLE "AnalyticsConnection" (
    "id" TEXT NOT NULL,
    "googleAccountEmail" TEXT,
    "propertyId" TEXT,
    "propertyDisplayName" TEXT,
    "refreshTokenEnc" TEXT,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastBriefJson" TEXT,
    "lastBriefAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailyStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsPageStat" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entrances" INTEGER NOT NULL DEFAULT 0,
    "exits" INTEGER NOT NULL DEFAULT 0,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityTitle" TEXT,
    "pageviewsPrev" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsPageStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailyStat_date_key" ON "AnalyticsDailyStat"("date");

-- CreateIndex
CREATE INDEX "AnalyticsDailyStat_date_idx" ON "AnalyticsDailyStat"("date");

-- CreateIndex
CREATE INDEX "AnalyticsPageStat_entityType_entityId_idx" ON "AnalyticsPageStat"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AnalyticsPageStat_pageviews_idx" ON "AnalyticsPageStat"("pageviews");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsPageStat_path_dateFrom_dateTo_key" ON "AnalyticsPageStat"("path", "dateFrom", "dateTo");
