import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SITE_IMAGES } from "@/website/tragwerker/images";

type SiteFeaturedProjectProps = {
  eyebrow?: string;
  title: string;
  project: {
    slug: string;
    name: string;
    category: string;
    description: string | null;
    excerpt?: string | null;
    heroImageUrl?: string | null;
    period?: string | null;
    location?: string | null;
  } | null;
};

export function SiteFeaturedProject({ eyebrow, title, project }: SiteFeaturedProjectProps) {
  if (!project) return null;

  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <Link
          href={`/projekte/${project.slug}`}
          className="group mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--site-line)] lg:aspect-[5/3]">
            <CmsImage
              src={project.heroImageUrl ?? SITE_IMAGES.projectFallback}
              alt={project.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-accent)]">
              {[project.period, project.category].filter(Boolean).join(" · ")}
            </p>
            <h3 className="mt-4 font-site-serif text-4xl leading-tight tracking-tight md:text-5xl">
              {project.name}
            </h3>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--site-muted)]">
              {project.location}
            </p>
            {(project.excerpt ?? project.description) ? (
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--site-muted)] md:text-lg">
                {project.excerpt ?? project.description}
              </p>
            ) : null}
            <span className="mt-8 inline-block text-xs uppercase tracking-[0.2em] underline underline-offset-4">
              Projekt ansehen
            </span>
          </div>
        </Link>
      </section>
    </SiteReveal>
  );
}
