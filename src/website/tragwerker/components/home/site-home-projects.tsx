import Link from "next/link";

import { HomeProjectCard } from "@/website/tragwerker/components/home/site-home-project-card";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";
import type { ProjectBrowserItem } from "@/website/tragwerker/components/project-list-card";

type SiteHomeProjectsProps = {
  title?: string;
  subtitle?: string;
  projects: ProjectBrowserItem[];
};

function columnOf<T>(items: T[], columns: number, index: number) {
  return items.filter((_, itemIndex) => itemIndex % columns === index);
}

export function SiteHomeProjects({
  title = "Konstruktive Lösungen aus der Praxis",
  subtitle = "Hochbau, Infrastruktur und Bestandsertüchtigungen.",
  projects,
}: SiteHomeProjectsProps) {
  if (projects.length === 0) return null;

  const items = projects.slice(0, 3).map((project, index) => ({
    project,
    indexLabel: String(index + 1).padStart(2, "0"),
  }));

  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <SiteSectionLabel index="003" title="PROJEKTE" />
            <h2 className="mt-4 font-site-serif text-3xl font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 font-site-sans text-base font-extralight text-[var(--site-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Link
            href="/projekte"
            className="site-link shrink-0 font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]"
          >
            Alle Projekte
          </Link>
        </div>

        <div className="flex flex-col gap-8 sm:hidden">
          {items.map(({ project, indexLabel }) => (
            <HomeProjectCard key={project.slug} layout="standard" indexLabel={indexLabel} {...project} />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-x-8 lg:hidden">
          {[0, 1].map((column) => (
            <div key={column} className="flex flex-col gap-8">
              {columnOf(items, 2, column).map(({ project, indexLabel }) => (
                <HomeProjectCard key={project.slug} layout="standard" indexLabel={indexLabel} {...project} />
              ))}
            </div>
          ))}
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-x-8">
          {items.map(({ project, indexLabel }) => (
            <HomeProjectCard key={project.slug} layout="standard" indexLabel={indexLabel} {...project} />
          ))}
        </div>
      </section>
    </SiteReveal>
  );
}
