import type { Metadata } from "next";

import { SITE_NAME } from "@/website/tragwerker/config";
import { defaultTragwerksplanungPage } from "@/website/tragwerker/defaults/tragwerksplanung-page";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildEntityMetadata, buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getPublishedProjects, getServiceBySlug } from "@/website/tragwerker/queries";
import { DisciplinePageTemplate } from "@/website/tragwerker/templates/discipline-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const service = await getServiceBySlug("tragwerksplanung");
  const fallback = {
    title: `Tragwerksplanung — ${SITE_NAME}`,
    description:
      "Wir planen Tragwerke — präzise, materialgerecht und eng abgestimmt mit der Architektur.",
    path: "/tragwerksplanung",
  };
  if (service) return buildEntityMetadata("service", service.id, fallback);
  return buildStaticMetadata(fallback);
}

export default async function TragwerksplanungPage() {
  const featured = await getPublishedProjects({ featured: true, limit: 12 });
  const projects =
    featured.length > 0 ? featured : await getPublishedProjects({ limit: 12 });

  return (
    <DisciplinePageTemplate
      content={defaultTragwerksplanungPage}
      heroImageUrl={SITE_IMAGES.heroPlanning}
      projects={projects.map((project) => ({
        slug: project.slug,
        name: project.name,
        excerpt: project.excerpt,
        description: project.description,
        location: project.location,
        category: project.category,
      }))}
    />
  );
}
