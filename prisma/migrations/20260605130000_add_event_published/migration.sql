-- AlterTable
ALTER TABLE "Event" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "publishedAt" TIMESTAMP(3);
