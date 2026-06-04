-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Published', 'Draft', 'InReview');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'Draft';
