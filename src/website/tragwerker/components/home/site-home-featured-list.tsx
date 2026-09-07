import Link from "next/link";

import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { stripHtml } from "@/website/tragwerker/lib/html";

export type FeaturedListProject = {
  slug: string;
  name: string;
  excerpt?: string | null;
  description?: string | null;
  location?: string | null;
  category?: string | null;
};

type SiteHomeFeaturedListProps = {
  title?: string;
  projects: FeaturedListProject[];
  /** Show “alle Projekte” link under the list. Default true. */
  showAllLink?: boolean;
  allLinkLabel?: string;
};

function subtitle(project: FeaturedListProject) {
  const excerpt = project.excerpt?.trim();
  if (excerpt) {
    const plain = stripHtml(excerpt);
    return plain.length > 110 ? `${plain.slice(0, 107).trim()}…` : plain;
  }
  if (project.location?.trim()) return project.location.trim();
  if (project.category?.trim()) return project.category.trim();
  if (project.description) {
    const plain = stripHtml(project.description);
    return plain.length > 110 ? `${plain.slice(0, 107).trim()}…` : plain;
  }
  return null;
}

/** Snøhetta-style highlighted projects: text list, no cards. */
export function SiteHomeFeaturedList({
  title = "Ausgewählte Projekte",
  projects,
  showAllLink = true,
  allLinkLabel = "→ Alle Projekte",
}: SiteHomeFeaturedListProps) {
  if (projects.length === 0) return null;

  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <h2 className="mb-10 font-site-sans text-xl font-extralight tracking-[-0.02em] text-[var(--site-muted)] md:mb-14 md:text-2xl">
          {title}
        </h2>

        <ul className="divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
          {projects.map((project) => {
            const line = subtitle(project);
            return (
              <li key={project.slug}>
                <Link
                  href={`/projekte/${project.slug}`}
                  className="site-link-quiet group flex flex-col gap-1 py-6 md:flex-row md:items-baseline md:justify-between md:gap-10 md:py-8"
                >
                  <span className="font-site-sans text-base font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-lg lg:text-xl">
                    {project.name}
                  </span>
                  {line ? (
                    <span className="max-w-xl font-site-sans text-sm font-extralight leading-snug text-[var(--site-muted)] md:text-right">
                      {line}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        {showAllLink ? (
          <div className="mt-10 md:mt-12">
            <Link
              href="/projekte"
              className="site-link inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em]"
            >
              {allLinkLabel}
            </Link>
          </div>
        ) : null}
      </section>
    </SiteReveal>
  );
}
