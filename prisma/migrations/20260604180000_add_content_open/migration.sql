-- CreateTable
CREATE TABLE "ContentOpen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentOpen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentOpen_userId_openedAt_idx" ON "ContentOpen"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "ContentOpen_openedAt_idx" ON "ContentOpen"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentOpen_userId_entityType_entityId_key" ON "ContentOpen"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "ContentOpen" ADD CONSTRAINT "ContentOpen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
