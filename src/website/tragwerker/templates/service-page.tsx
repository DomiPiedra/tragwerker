import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SiteDeliverablesSection } from "@/website/tragwerker/components/site-deliverables-section";
import { SiteExpertiseGrid } from "@/website/tragwerker/components/site-expertise-grid";
import { SiteFeaturedProject } from "@/website/tragwerker/components/site-featured-project";
import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
import { SiteProcessSection } from "@/website/tragwerker/components/site-process-section";
import { SiteSplitIntro } from "@/website/tragwerker/components/site-split-intro";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { getPublishedProjects } from "@/website/tragwerker/queries";
import type { ServiceSections } from "@/website/tragwerker/types";

type ServicePageTemplateProps = {
  title: string;
  summary: string;
  heroImageUrl?: string | null;
  heroImageFallback?: string;
  sections: ServiceSections;
  cta?: {
    headline?: string | null;
    text?: string | null;
    buttonLabel?: string | null;
    email?: string | null;
  };
};

export async function ServicePageTemplate({
  title,
  summary,
  heroImageUrl,
  heroImageFallback = SITE_IMAGES.heroPlanning,
  sections,
  cta,
}: ServicePageTemplateProps) {
  const [featuredProject] = sections.featuredProject
    ? await getPublishedProjects({ limit: 1 })
    : [null];

  return (
    <>
      <SiteFullBleedHero
        imageSrc={heroImageUrl ?? heroImageFallback}
        imageAlt={title}
        heading={{
          pageName: title,
          headline: summary,
        }}
      />

      {sections.intro ? (
        <SiteSplitIntro
          eyebrow={sections.intro.eyebrow}
          title={sections.intro.title}
          paragraphs={sections.intro.paragraphs}
          imageSrc={sections.intro.imageUrl}
          imageAlt={sections.intro.title}
          imagePosition={sections.intro.imagePosition}
        />
      ) : null}

      {sections.pruefleistungen ? (
        <SiteExpertiseGrid
          eyebrow={sections.pruefleistungen.eyebrow}
          title={sections.pruefleistungen.title}
          items={sections.pruefleistungen.items}
        />
      ) : null}

      {sections.process ? (
        <SiteProcessSection
          eyebrow={sections.process.eyebrow}
          title={sections.process.title}
          steps={sections.process.steps}
        />
      ) : null}

      {sections.deliverables ? (
        <SiteDeliverablesSection
          eyebrow={sections.deliverables.eyebrow}
          items={sections.deliverables.items}
        />
      ) : null}

      {sections.expertise ? (
        <SiteExpertiseGrid
          eyebrow={sections.expertise.eyebrow}
          title={sections.expertise.title}
          items={sections.expertise.items}
        />
      ) : null}

      {sections.featuredProject ? (
        <SiteFeaturedProject
          eyebrow="Referenz"
          title="Ausgewähltes Projekt"
          project={featuredProject}
        />
      ) : null}

      <SiteContactCta
        headline={cta?.headline ?? "Kontakt aufnehmen"}
        text={cta?.text ?? "Wir freuen uns auf Ihre Anfrage."}
        buttonLabel={cta?.buttonLabel ?? "E-Mail senden"}
        mailto={cta?.email ?? SITE_CONTACT_EMAIL}
      />
    </>
  );
}
