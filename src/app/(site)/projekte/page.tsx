import type { Metadata } from "next";

import { ProjectsBrowser } from "@/website/tragwerker/components/projects-browser";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_NAME, SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getProjectCategories, getPublishedProjects } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildStaticMetadata({
  title: `Projekte — ${SITE_NAME}`,
  description: "Referenzprojekte der Tragwerker GmbH — Tragwerksplanung in München und darüber hinaus.",
  path: "/projekte",
});

type PageProps = { searchParams?: Promise<{ kategorie?: string }> };

export default async function ProjektePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const [projects, categories] = await Promise.all([getPublishedProjects(), getProjectCategories()]);

  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Projekte"
        headline="Unsere Arbeit wird sichtbar im Bauwerk."
        intro="Hochbau, Infrastruktur und Bestandsertüchtigungen."
      />

      <ProjectsBrowser
        projects={projects.map((project) => ({
          slug: project.slug,
          name: project.name,
          description: project.description,
          excerpt: project.excerpt,
          period: project.period,
          year: project.year,
          heroImageUrl: project.heroImageUrl,
          category: project.category,
          location: project.location,
        }))}
        categories={categories}
        initialCategory={params.kategorie}
      />

      <SiteContactCta
        headline="Interesse an einer Zusammenarbeit?"
        text="Sprechen Sie mit uns über Ihr Bauvorhaben."
        buttonLabel="Kontakt aufnehmen"
        mailto={SITE_CONTACT_EMAIL}
      />
    </>
  );
}
