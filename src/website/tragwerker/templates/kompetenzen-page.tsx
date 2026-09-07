import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
import { SiteProcessChapter } from "@/website/tragwerker/components/site-process-chapter";
import { SiteProcessTeasers } from "@/website/tragwerker/components/site-process-teasers";
import { SiteProcessToc } from "@/website/tragwerker/components/site-process-toc";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import type { KompetenzenPageContent } from "@/website/tragwerker/kompetenzen-content";

export function KompetenzenPageTemplate({ content }: { content: KompetenzenPageContent }) {
  return (
    <article>
      <SiteFullBleedHero
        imageSrc={SITE_IMAGES.heroKompetenzen}
        imageAlt={content.title}
        heading={{
          pageName: content.title,
          headline: content.headline,
          intro: content.intro,
        }}
      />

      {content.chapters.map((chapter) => (
        <SiteProcessChapter key={chapter.id} chapter={chapter} />
      ))}

      <div className="h-20 md:h-24" aria-hidden />
      <div id="kompetenzen-end" aria-hidden className="h-px" />

      <SiteProcessTeasers items={content.teasers} />

      <SiteProcessToc chapters={content.chapters} />
    </article>
  );
}
