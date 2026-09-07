import Link from "next/link";

import { SiteEditorialSection } from "@/website/tragwerker/components/site-editorial-section";
import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
import {
  SiteHomeFeaturedList,
  type FeaturedListProject,
} from "@/website/tragwerker/components/home/site-home-featured-list";
import { SiteProcessTeasers } from "@/website/tragwerker/components/site-process-teasers";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import type { DisciplinePageContent } from "@/website/tragwerker/discipline-content";

type DisciplinePageTemplateProps = {
  content: DisciplinePageContent;
  heroImageUrl: string;
  projects: FeaturedListProject[];
};

function headingHeadline(title: string, statement: string) {
  const prefix = `${title} `;
  return statement.startsWith(prefix) ? statement.slice(prefix.length) : statement;
}

/** Snøhetta /disciplines layout — hero, lead, sections, project list, teasers. */
export function DisciplinePageTemplate({
  content,
  heroImageUrl,
  projects,
}: DisciplinePageTemplateProps) {
  return (
    <article>
      <SiteFullBleedHero
        imageSrc={heroImageUrl}
        imageAlt={content.title}
        heading={{
          pageName: content.title,
          headline: headingHeadline(content.title, content.statement),
        }}
      />

      <SiteReveal>
        <div className="site-container border-t border-[var(--site-line)] py-12 md:py-16">
          <p className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
            <span>{content.breadcrumbLabel}</span>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-[var(--site-ink)]">{content.title}</span>
          </p>

          <div className="mt-10 max-w-[65ch] space-y-5 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)] md:mt-12">
            {content.lead.map((paragraph) => (
              <p key={paragraph.slice(0, 56)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </SiteReveal>

      {content.sections.map((section, index) => (
        <SiteEditorialSection
          key={section.id}
          section={section}
          prominence={index === 0 ? "lead" : "default"}
        />
      ))}

      <SiteHomeFeaturedList title={content.projectsTitle} projects={projects} showAllLink={false} />

      {content.closing ? <SiteEditorialSection section={content.closing} /> : null}

      {projects.length > 0 ? (
        <div className="site-container border-t border-[var(--site-line)] py-10 md:py-12">
          <Link
            href="/projekte"
            className="site-link inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em]"
          >
            {content.projectsLinkLabel}
          </Link>
        </div>
      ) : null}

      <SiteProcessTeasers items={content.teasers} />
    </article>
  );
}
