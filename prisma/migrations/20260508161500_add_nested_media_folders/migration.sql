-- AlterTable
ALTER TABLE "MediaFolder" ADD COLUMN "parentId" TEXT;

-- DropIndex
DROP INDEX "MediaFolder_name_key";

-- CreateIndex
CREATE INDEX "MediaFolder_parentId_idx" ON "MediaFolder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_name_parentId_key" ON "MediaFolder"("name", "parentId");

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
