-- AlterTable BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable Event
ALTER TABLE "Event" ADD COLUMN "content" TEXT;
ALTER TABLE "Event" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable Property
ALTER TABLE "Property" ADD COLUMN "description" TEXT;
ALTER TABLE "Property" ADD COLUMN "content" TEXT;
ALTER TABLE "Property" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
