import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { cn } from "@/lib/utils";

type SiteFullBleedHeroProps = {
  imageSrc: string;
  imageAlt: string;
  heading?: {
    pageName: string;
    headline: string;
    intro?: string;
  };
  /** Used when there is no heading. Default 0.8 (80svh). Pass 1 for full viewport. */
  viewportRatio?: number;
};

export function SiteFullBleedHero({
  imageSrc,
  imageAlt,
  heading,
  viewportRatio = 0.8,
}: SiteFullBleedHeroProps) {
  const media = (
    <div className="site-media-reveal site-media-kenburns absolute inset-0">
      <CmsImage
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );

  if (heading) {
    return (
      <div className="relative -mt-[var(--site-header-offset)] flex h-svh max-h-svh flex-col">
        <section className="relative min-h-0 flex-1 overflow-hidden">{media}</section>
        <SitePageHeadingSection
          className="shrink-0"
          placement="underHero"
          pageName={heading.pageName}
          headline={heading.headline}
          intro={heading.intro}
        />
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative -mt-[var(--site-header-offset)] w-full overflow-hidden",
        viewportRatio >= 1 ? "min-h-svh" : "h-[80svh]"
      )}
    >
      {media}
    </section>
  );
}
