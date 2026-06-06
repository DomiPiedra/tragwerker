-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FullTime', 'PartTime', 'Freelance', 'Internship', 'WorkingStudent', 'Contract');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('OnSite', 'Hybrid', 'Remote');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "location" TEXT,
    "employmentType" "EmploymentType",
    "remoteType" "RemoteType",
    "salary" TEXT,
    "applicationEmail" TEXT,
    "applicationUrl" TEXT,
    "shortDescription" TEXT,
    "content" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "responsibilities" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_authorId_idx" ON "Job"("authorId");

-- CreateIndex
CREATE INDEX "Job_published_idx" ON "Job"("published");

-- CreateIndex
CREATE INDEX "Job_department_idx" ON "Job"("department");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
