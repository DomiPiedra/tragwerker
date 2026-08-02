import { SiteHomeHero } from "@/website/tragwerker/components/home/site-home-hero";
import { SiteHomeHighlights } from "@/website/tragwerker/components/home/site-home-highlights";
import { SiteHomePhilosophy } from "@/website/tragwerker/components/home/site-home-philosophy";
import { SiteHomeProcess } from "@/website/tragwerker/components/home/site-home-process";
import { SiteHomeServices } from "@/website/tragwerker/components/home/site-home-services";
import { SiteHomeStats } from "@/website/tragwerker/components/home/site-home-stats";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/website/tragwerker/config";
import { defaultHomepage } from "@/website/tragwerker/defaults/content";
import { getPublishedProjects } from "@/website/tragwerker/queries";
import type { HomepageContent } from "@/website/tragwerker/types";

export async function HomePageTemplate({ content }: { content: HomepageContent }) {
  const featuredProjects = await getPublishedProjects({ featured: true, limit: 8 });
  const showcaseProjects =
    featuredProjects.length > 0
      ? featuredProjects
      : await getPublishedProjects({ limit: 8 });

  const defaultPhilosophyImages = defaultHomepage.philosophy.imageUrls!;
  const philosophyImages: [string, string] = [
    content.philosophy.imageUrls?.[0] || defaultPhilosophyImages[0],
    content.philosophy.imageUrls?.[1] || defaultPhilosophyImages[1],
  ];
  const defaultHighlights = defaultHomepage.highlights!;
  const highlights = defaultHighlights.map((fallback, index) => {
    const fromCms = content.highlights?.[index];
    if (!fromCms) return fallback;
    return { ...fallback, ...fromCms };
  });

  const stats =
    content.stats?.some((stat) => stat.label === "Seit" || stat.label === "Team")
      ? defaultHomepage.stats
      : content.stats?.length
        ? content.stats
        : defaultHomepage.stats;

  const statement = `${SITE_NAME} entwickeln Tragwerke, die bleiben — ${content.hero.subheadline.replace(/\.$/, "")}.`;

  return (
    <>
      <SiteHomeHero
        statement={statement}
        projects={showcaseProjects.map((project) => ({
          slug: project.slug,
          name: project.name,
          heroImageUrl: project.heroImageUrl,
          location: project.location,
          category: project.category,
          excerpt: project.excerpt,
          description: project.description,
        }))}
      />

      <div className="relative z-[2] bg-[var(--site-paper)]">
        <SiteHomeStats stats={stats} />

        <SiteHomePhilosophy
          title={content.philosophy.title}
          paragraphs={content.philosophy.paragraphs}
          imageUrls={philosophyImages}
        />

        <SiteHomeServices />

        <SiteHomeProcess title={content.process.title} steps={content.process.steps} />

        <SiteHomeHighlights items={highlights} />

        <SiteContactCta
          headline={content.contact.headline}
          text={content.contact.text}
          buttonLabel="Kontakt aufnehmen"
          mailto={SITE_CONTACT_EMAIL}
        />
      </div>
    </>
  );
}

export function getHomepageDefaults() {
  return defaultHomepage;
}
