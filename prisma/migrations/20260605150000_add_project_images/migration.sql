-- AlterTable
ALTER TABLE "Project" ADD COLUMN "heroImageUrl" TEXT,
ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
