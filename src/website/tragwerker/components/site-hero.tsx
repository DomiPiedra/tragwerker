import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

type SiteHeroProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  subintro?: string;
  imageSrc: string;
  imageAlt: string;
};

export function SiteHero({ eyebrow, title, intro, subintro, imageSrc, imageAlt }: SiteHeroProps) {
  return (
    <SiteReveal>
      <section className="site-container grid gap-10 pb-20 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
        <div>
          {eyebrow ? (
            <p className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-6 whitespace-pre-line font-site-serif text-[2.125rem] leading-[1.12] tracking-[-0.02em] md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            {title}
          </h1>
          {intro ? (
            <p className="mt-8 max-w-[40ch] font-site-sans text-lg font-extralight leading-relaxed text-[var(--site-muted)] md:text-xl">
              {intro}
            </p>
          ) : null}
          {subintro ? (
            <p className="mt-5 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
              {subintro}
            </p>
          ) : null}
        </div>
        <div className="site-media-frame relative aspect-[4/5] overflow-hidden bg-[var(--site-line)]">
          <CmsImage
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </section>
    </SiteReveal>
  );
}
