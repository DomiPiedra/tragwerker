import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SitePageHeading } from "@/website/tragwerker/components/site-page-heading";

type SiteFullBleedHeroProps = {
  imageSrc: string;
  imageAlt: string;
  heading?: {
    pageName: string;
    headline: string;
  };
};

export function SiteFullBleedHero({ imageSrc, imageAlt, heading }: SiteFullBleedHeroProps) {
  return (
    <section className="relative -mt-[var(--site-header-offset)] min-h-svh w-full">
      <CmsImage
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {heading ? (
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="site-container w-full">
            <div className="site-grid">
              <div className="site-grid-span-6">
                <SitePageHeading
                  pageName={heading.pageName}
                  headline={heading.headline}
                  overlay
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
