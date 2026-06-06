import type { EmploymentType, Prisma, RemoteType } from "@/generated/prisma/client";

export type JobListFilters = {
  department?: string;
  location?: string;
  employmentType?: EmploymentType;
  remoteType?: RemoteType;
  featured?: boolean;
  publishedOnly?: boolean;
  search?: string;
};

export function buildJobWhere(filters: JobListFilters): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {};

  if (filters.publishedOnly) {
    where.published = true;
  }

  if (filters.department) {
    where.department = { equals: filters.department, mode: "insensitive" };
  }

  if (filters.location) {
    where.location = { equals: filters.location, mode: "insensitive" };
  }

  if (filters.employmentType) {
    where.employmentType = filters.employmentType;
  }

  if (filters.remoteType) {
    where.remoteType = filters.remoteType;
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { position: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function parseJobListFilters(searchParams: URLSearchParams): JobListFilters {
  const employmentType = searchParams.get("employmentType");
  const remoteType = searchParams.get("remoteType");

  return {
    department: searchParams.get("department") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    employmentType: employmentType ? (employmentType as EmploymentType) : undefined,
    remoteType: remoteType ? (remoteType as RemoteType) : undefined,
    featured:
      searchParams.get("featured") === "true"
        ? true
        : searchParams.get("featured") === "false"
          ? false
          : undefined,
    publishedOnly: searchParams.get("published") !== "false",
    search: searchParams.get("q") ?? undefined,
  };
}
