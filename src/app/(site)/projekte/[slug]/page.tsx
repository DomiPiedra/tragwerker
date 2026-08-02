import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { ProjectCard } from "@/website/tragwerker/components/project-card";
import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { buildEntityMetadata } from "@/website/tragwerker/metadata";
import { getProjectBySlug, getRelatedProjects } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return buildEntityMetadata("project", project.id, {
    title: `${project.name} — Tragwerker`,
    description: project.excerpt ?? project.description ?? "",
    path: `/projekte/${project.slug}`,
    imageUrl: project.heroImageUrl,
  });
}

export default async function ProjektDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const related = await getRelatedProjects(project.id, project.category);
  const technicalData =
    project.technicalData && typeof project.technicalData === "object"
      ? (project.technicalData as Record<string, string[]>)
      : null;

  return (
    <article>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Projekte"
        headline={project.name}
        intro={project.excerpt ?? undefined}
      />

      <section className="site-container grid gap-10 border-t border-[var(--site-line)] py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--site-accent)]">
            {project.category}
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.18em] text-[var(--site-muted)]">
            {[project.period, project.location].filter(Boolean).join(" · ")}
          </p>
          {project.client ? (
            <p className="mt-4 text-sm text-[var(--site-muted)]">
              <span className="uppercase tracking-[0.16em] text-[var(--site-ink)]">Bauherr</span>
              <br />
              {project.client}
            </p>
          ) : null}
          {project.architect ? (
            <p className="mt-4 text-sm text-[var(--site-muted)]">
              <span className="uppercase tracking-[0.16em] text-[var(--site-ink)]">Architektur</span>
              <br />
              {project.architect}
            </p>
          ) : null}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--site-line)]">
          <CmsImage
            src={project.heroImageUrl}
            alt={project.name}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </section>

      {project.description ? (
        <section className="site-container max-w-3xl border-t border-[var(--site-line)] py-16">
          <SectionHeading eyebrow="Projekt" title="Projektbeschreibung" description={project.description} />
        </section>
      ) : null}

      {technicalData ? (
        <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
          <SectionHeading eyebrow="Daten" title="Technische Daten" />
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {Object.entries(technicalData).map(([key, values]) => (
              <div key={key}>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-accent)]">{key}</p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--site-muted)]">
                  {values.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {project.galleryUrls.length > 0 ? (
        <section className="site-container py-16 md:py-24">
          <SectionHeading eyebrow="Galerie" title="Projektbilder" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {project.galleryUrls.map((url) => (
              <div key={url} className="relative aspect-[4/3] overflow-hidden bg-[var(--site-line)]">
                <CmsImage src={url} alt={`${project.name} Galerie`} fill sizes="50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
          <SectionHeading eyebrow="Weitere Projekte" title="Referenzen" />
          <div className="mt-10 grid gap-12 md:grid-cols-3">
            {related.map((item) => (
              <ProjectCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteContactCta
        headline="Projekt anfragen"
        text="Planen Sie ein ähnliches Bauvorhaben?"
        buttonLabel="Kontakt aufnehmen"
        mailto={SITE_CONTACT_EMAIL}
      />
    </article>
  );
}
