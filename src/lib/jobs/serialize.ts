import type { EmploymentType, Job, RemoteType } from "@/generated/prisma/client";

export type SerializedJob = {
  id: string;
  title: string;
  slug: string;
  position: string | null;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType | null;
  remoteType: RemoteType | null;
  salary: string | null;
  applicationEmail: string | null;
  applicationUrl: string | null;
  shortDescription: string | null;
  content: string | null;
  requirements: string | null;
  benefits: string | null;
  responsibilities: string | null;
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  authorId: string | null;
  updatedAt: string;
  createdAt: string;
};

export function serializeJob(job: Job): SerializedJob {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    position: job.position,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    remoteType: job.remoteType,
    salary: job.salary,
    applicationEmail: job.applicationEmail,
    applicationUrl: job.applicationUrl,
    shortDescription: job.shortDescription,
    content: job.content,
    requirements: job.requirements,
    benefits: job.benefits,
    responsibilities: job.responsibilities,
    featured: job.featured,
    published: job.published,
    publishedAt: job.publishedAt ? job.publishedAt.toISOString() : null,
    authorId: job.authorId,
    updatedAt: job.updatedAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
  };
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Freelance: "Freelance",
  Internship: "Internship",
  WorkingStudent: "Working Student",
  Contract: "Contract",
};

export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  OnSite: "On-site",
  Hybrid: "Hybrid",
  Remote: "Remote",
};
