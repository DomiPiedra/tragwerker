import { SiteHomeContact } from "@/website/tragwerker/components/home/site-home-contact";
import { SiteHomeHero } from "@/website/tragwerker/components/home/site-home-hero";
import { SiteHomePhilosophy } from "@/website/tragwerker/components/home/site-home-philosophy";
import { SiteHomeProcess } from "@/website/tragwerker/components/home/site-home-process";
import { SiteHomeProjects } from "@/website/tragwerker/components/home/site-home-projects";
import { SiteHomeServices } from "@/website/tragwerker/components/home/site-home-services";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { defaultHomepage } from "@/website/tragwerker/defaults/content";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { getPublishedProjects } from "@/website/tragwerker/queries";
import type { HomepageContent } from "@/website/tragwerker/types";

export async function HomePageTemplate({ content }: { content: HomepageContent }) {
  const featuredProjects = await getPublishedProjects({ featured: true, limit: 10 });
  const showcaseProjects =
    featuredProjects.length > 0
      ? featuredProjects
      : await getPublishedProjects({ limit: 10 });

  const philosophyImage =
    content.philosophy.imageUrls?.[0] || defaultHomepage.philosophy.imageUrls![0];

  const stats =
    Array.isArray(content.stats) && content.stats.length > 0
      ? content.stats.some((stat) => stat.label === "Seit" || stat.label === "Team")
        ? defaultHomepage.stats
        : content.stats
      : defaultHomepage.stats;

  const projectItems = showcaseProjects.slice(0, 3).map((project) => ({
    slug: project.slug,
    name: project.name,
    excerpt: project.excerpt,
    description: project.description,
    location: project.location,
    category: project.category,
    year: project.year,
    period: project.period,
    heroImageUrl: project.heroImageUrl,
  }));

  return (
    <>
      <SiteHomeHero
        headline={defaultHomepage.hero.headline}
        subheadline={defaultHomepage.hero.subheadline}
        stats={stats}
        imageSrc={SITE_IMAGES.heroHomeWireframe}
      />

      <div className="relative z-[2] bg-[var(--site-paper)]">
        <SiteHomeServices />

        <SiteHomeProjects
          title="Konstruktive Lösungen aus der Praxis"
          subtitle="Hochbau, Infrastruktur und Bestandsertüchtigungen."
          projects={projectItems}
        />

        <SiteHomePhilosophy
          title={defaultHomepage.philosophy.title}
          paragraphs={defaultHomepage.philosophy.paragraphs}
          focusAreas={defaultHomepage.philosophy.focusAreas}
          imageUrl={philosophyImage}
        />

        <SiteHomeProcess
          title={defaultHomepage.process.title}
          steps={defaultHomepage.process.steps}
        />

        <SiteHomeContact
          headline={content.contact.headline}
          text={content.contact.text}
          mailto={SITE_CONTACT_EMAIL}
        />
      </div>
    </>
  );
}

export function getHomepageDefaults() {
  return defaultHomepage;
}
