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
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <Link
          href={`/projekte/${project.slug}`}
          className="group mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16"
        >
          <div className="site-media-frame relative aspect-[16/10] overflow-hidden bg-[var(--site-line)] lg:aspect-[5/3]">
            <CmsImage
              src={project.heroImageUrl ?? SITE_IMAGES.projectFallback}
              alt={project.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
          <div>
            <p className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
              {[project.period, project.category].filter(Boolean).join(" · ")}
            </p>
            <h3 className="mt-4 font-site-serif text-3xl leading-tight tracking-[-0.02em] md:text-4xl">
              {project.name}
            </h3>
            <p className="mt-3 font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
              {project.location}
            </p>
            {(project.excerpt ?? project.description) ? (
              <p className="mt-5 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
                {project.excerpt ?? project.description}
              </p>
            ) : null}
            <span className="site-link mt-8 inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em]">
              Projekt ansehen
            </span>
          </div>
        </Link>
      </section>
    </SiteReveal>
  );
}
