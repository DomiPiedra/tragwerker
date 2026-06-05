-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TeamMember" ADD COLUMN "publishedAt" TIMESTAMP(3);
