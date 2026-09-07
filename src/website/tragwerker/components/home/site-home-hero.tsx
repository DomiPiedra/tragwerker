import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_LOGO_HERO_ID } from "@/website/tragwerker/lib/logo";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import type { HomeStat } from "@/website/tragwerker/types";

type SiteHomeHeroProps = {
  headline: string;
  subheadline: string;
  stats?: HomeStat[];
  imageSrc?: string;
};

export function SiteHomeHero({
  headline,
  subheadline,
  stats = [],
  imageSrc = SITE_IMAGES.heroHome,
}: SiteHomeHeroProps) {
  const widgetStats = Array.isArray(stats) ? stats.slice(0, 4) : [];

  return (
    <section className="relative -mt-[var(--site-header-offset)] flex min-h-svh flex-col overflow-hidden bg-[var(--site-paper)]">
      <div className="site-media-reveal site-media-kenburns absolute inset-0" aria-hidden>
        <CmsImage
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[var(--site-paper)]/20" />
      </div>

      <div className="site-container relative flex min-h-svh min-w-0 flex-1 flex-col pb-10 pt-[calc(var(--site-header-offset)+1.5rem)] md:pb-14 lg:pb-16">
        <div className="mt-[6vh] flex items-start justify-between gap-10 md:mt-[10vh] lg:mt-[12vh] lg:gap-16">
          <div className="min-w-0 max-w-4xl">
            <h1 className="max-w-[20ch] font-site-serif text-[2.125rem] font-normal leading-[1.12] tracking-[-0.02em] text-[var(--site-ink)] md:max-w-[24ch] md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              {headline}
            </h1>
            <p className="mt-8 max-w-[40ch] font-site-sans text-lg font-extralight leading-relaxed text-[var(--site-ink)] md:mt-10 md:text-xl">
              {subheadline}
            </p>
          </div>
          <div
            id={SITE_LOGO_HERO_ID}
            className="pointer-events-none hidden shrink-0 md:block md:size-32 lg:size-40"
            aria-hidden
          />
        </div>

        <div className="mt-auto min-w-0 pt-16">
          <SiteSectionLabel index="001" title="INGENIEURBÜRO FÜR TRAGWERKSPLANUNG" className="mb-5" />
          {widgetStats.length > 0 ? (
            <div className="flex min-w-0 items-stretch gap-3 md:gap-5">
              <div className="w-px shrink-0 bg-[var(--site-hero-rule)]" aria-hidden />
              <dl className="grid min-w-0 flex-1 grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-4 md:flex md:flex-wrap md:gap-x-12">
                {widgetStats.map((stat) => (
                  <div key={stat.label} className="min-w-0">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="whitespace-pre-line font-site-sans text-xl font-normal tracking-[-0.03em] text-[var(--site-ink)] md:text-2xl">
                      {stat.value}
                    </dd>
                    <dd className="mt-1 max-w-full break-words font-site-sans text-xs font-extralight uppercase tracking-[0.12em] text-[var(--site-muted)] md:max-w-[12rem] md:tracking-[0.2em]">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
