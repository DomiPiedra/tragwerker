import { ProjectStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import type { HomepageContent, PageSections, ServiceSections } from "@/website/tragwerker/types";

const published = { status: ProjectStatus.Published } as const;

export async function getPublishedProjects(options?: { featured?: boolean; limit?: number; category?: string }) {
  return prisma.project.findMany({
    where: {
      ...published,
      ...(options?.featured ? { featured: true } : {}),
      ...(options?.category ? { category: options.category } : {}),
    },
    orderBy: [{ featured: "desc" }, { year: "desc" }, { updatedAt: "desc" }],
    take: options?.limit,
  });
}

export async function getProjectCategories() {
  const rows = await prisma.project.findMany({
    where: published,
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({ where: { slug, ...published } });
}

export async function getRelatedProjects(currentId: string, category: string, limit = 3) {
  return prisma.project.findMany({
    where: { ...published, id: { not: currentId }, category },
    orderBy: { year: "desc" },
    take: limit,
  });
}

export async function getPublishedTeam() {
  return prisma.teamMember.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getPublishedJobs() {
  return prisma.job.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getJobBySlug(slug: string) {
  return prisma.job.findFirst({ where: { slug, published: true } });
}

export async function getPageBySlug(slug: string) {
  return prisma.page.findFirst({ where: { slug, ...published } });
}

export async function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, ...published } });
}

export function parseJson<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export async function getHomepageContent() {
  const page = await getPageBySlug("homepage");
  if (!page?.body) return null;
  return { page, content: parseJson<HomepageContent>(page.body) };
}

export async function getPageSections(slug: string) {
  const page = await getPageBySlug(slug);
  if (!page) return null;
  return {
    page,
    sections: parseJson<PageSections>(page.body),
  };
}

export async function getServiceSections(slug: string) {
  const service = await getServiceBySlug(slug);
  if (!service) return null;
  return {
    service,
    sections: parseJson<ServiceSections>(service.sections),
  };
}

export type SearchResult = {
  type: string;
  title: string;
  excerpt: string;
  href: string;
};

export async function searchSite(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [projects, team, jobs, pages] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...published,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.teamMember.findMany({
      where: {
        published: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { role: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
    prisma.job.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
    prisma.page.findMany({
      where: {
        ...published,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
  ]);

  return [
    ...projects.map((p) => ({
      type: "Projekt",
      title: p.name,
      excerpt: p.excerpt ?? p.description?.slice(0, 120) ?? "",
      href: `/projekte/${p.slug}`,
    })),
    ...team.map((m) => ({
      type: "Team",
      title: m.name,
      excerpt: m.role,
      href: "/menschen",
    })),
    ...jobs.map((j) => ({
      type: "Job",
      title: j.title,
      excerpt: j.shortDescription ?? "",
      href: `/jobs/${j.slug}`,
    })),
    ...pages.map((p) => ({
      type: "Seite",
      title: p.title,
      excerpt: p.excerpt ?? "",
      href: p.slug === "homepage" ? "/" : `/${p.slug}`,
    })),
  ];
}
