-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "heroImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "architect" TEXT,
ADD COLUMN     "client" TEXT,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "technicalData" JSONB,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "ctaButtonLabel" TEXT,
ADD COLUMN     "ctaEmail" TEXT,
ADD COLUMN     "ctaHeadline" TEXT,
ADD COLUMN     "ctaText" TEXT,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "sections" JSONB;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "organization" TEXT,
    "projectName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "publication" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Award_published_sortOrder_idx" ON "Award"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "Publication_published_sortOrder_idx" ON "Publication"("published", "sortOrder");
