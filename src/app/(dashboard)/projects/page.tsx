import { ProjectStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { ProjectsListClient } from "./projects-list-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    author: p.author ?? "Sarah",
    category: p.category ?? "Residential",
    status: p.status ?? ProjectStatus.Draft,
    description: p.description,
    content: p.content,
    heroImageUrl: p.heroImageUrl,
    galleryUrls: p.galleryUrls ?? [],
    updatedAt: p.updatedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }));

  return <ProjectsListClient initialProjects={serialized} />;
}
