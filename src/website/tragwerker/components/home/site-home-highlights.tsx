import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";

type Highlight = {
  title: string;
  paragraphs: string[];
  href: string;
  imageUrl: string;
};

type SiteHomeHighlightsProps = {
  items: Highlight[];
};

export function SiteHomeHighlights({ items }: SiteHomeHighlightsProps) {
  const [left, right] = items;

  if (!left) return null;

  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <SiteSectionLabel index="006" title="PLANUNGSVERSTÄNDNIS" />

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-x-10">
          <Link href={left.href} className="group block lg:col-span-7">
            <div className="site-media-frame relative aspect-[16/10] overflow-hidden bg-[var(--site-line)] md:aspect-[5/3]">
              <CmsImage
                src={left.imageUrl}
                alt={left.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <h3 className="mt-6 font-site-serif text-xl tracking-[-0.02em] md:mt-8 md:text-2xl">
              {left.title}
            </h3>
            <div className="mt-6 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
              {left.paragraphs.slice(0, 1).map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </Link>

          {right ? (
            <Link href={right.href} className="group block lg:col-span-5 lg:col-start-8 lg:pt-16">
              <div className="site-media-frame relative aspect-square max-w-[88%] overflow-hidden bg-[var(--site-line)] lg:ml-auto lg:max-w-full">
                <CmsImage
                  src={right.imageUrl}
                  alt={right.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 34vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <h3 className="mt-6 font-site-serif text-xl tracking-[-0.02em] md:mt-8 md:text-2xl lg:ml-auto lg:max-w-[88%]">
                {right.title}
              </h3>
              <div className="mt-6 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)] lg:ml-auto lg:max-w-[88%]">
                {right.paragraphs.slice(0, 1).map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </Link>
          ) : null}
        </div>
      </section>
    </SiteReveal>
  );
}
