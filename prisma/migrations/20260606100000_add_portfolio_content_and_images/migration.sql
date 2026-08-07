-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN "content" TEXT;
ALTER TABLE "PortfolioItem" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "PortfolioItem" ADD COLUMN "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
