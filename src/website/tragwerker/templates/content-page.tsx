import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SiteExpertiseGrid } from "@/website/tragwerker/components/site-expertise-grid";
import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
import { SiteProcessSection } from "@/website/tragwerker/components/site-process-section";
import { SiteSplitIntro } from "@/website/tragwerker/components/site-split-intro";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import type { PageSections } from "@/website/tragwerker/types";

export function ContentPageTemplate({ sections }: { sections: PageSections }) {
  const hero = sections.hero;

  return (
    <>
      {hero ? (
        <SiteFullBleedHero
          imageSrc={hero.imageUrl ?? SITE_IMAGES.heroProjects}
          imageAlt={hero.title}
          heading={{
            pageName: hero.title,
            headline: hero.headline ?? hero.intro ?? hero.title,
          }}
        />
      ) : null}

      {sections.sections?.map((section) => {
        if (section.items?.length) {
          return (
            <SiteExpertiseGrid
              key={section.title}
              eyebrow={section.eyebrow}
              title={section.title}
              items={section.items}
            />
          );
        }
        if (section.steps?.length) {
          return (
            <SiteProcessSection
              key={section.title}
              eyebrow={section.eyebrow}
              title={section.title}
              steps={section.steps}
            />
          );
        }
        if (section.paragraphs?.length) {
          return (
            <SiteSplitIntro
              key={section.title}
              eyebrow={section.eyebrow}
              title={section.title}
              paragraphs={section.paragraphs}
              imageSrc={SITE_IMAGES.introCollaboration}
              imageAlt={section.title}
            />
          );
        }
        return null;
      })}

      {sections.cta ? (
        <SiteContactCta
          headline={sections.cta.headline}
          text={sections.cta.text}
          buttonLabel={sections.cta.buttonLabel}
          mailto={sections.cta.mailto}
        />
      ) : (
        <SiteContactCta
          headline="Kontakt aufnehmen"
          text="Für Anfragen und fachlichen Austausch."
          buttonLabel="E-Mail senden"
          mailto={SITE_CONTACT_EMAIL}
        />
      )}
    </>
  );
}
