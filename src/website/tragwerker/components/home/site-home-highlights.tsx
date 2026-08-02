import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";

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
    <section className="site-container pb-20 md:pb-28 lg:pb-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
        <Link href={left.href} className="group block lg:col-span-7">
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--site-line)] md:aspect-[5/3]">
            <CmsImage
              src={left.imageUrl}
              alt={left.title}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
          <h3 className="mt-6 font-site-serif text-xl tracking-[-0.02em] md:mt-8 md:text-2xl">
            {left.title}
          </h3>
          <div className="mt-5 grid gap-6 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:mt-6 md:grid-cols-2 md:gap-8 md:text-[0.9375rem]">
            {left.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </Link>

        {right ? (
          <Link href={right.href} className="group block lg:col-span-5 lg:col-start-8 lg:pt-0">
            <div className="relative aspect-square max-w-[88%] overflow-hidden bg-[var(--site-line)] lg:ml-auto lg:max-w-full">
              <CmsImage
                src={right.imageUrl}
                alt={right.title}
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
            <h3 className="mt-6 font-site-serif text-xl tracking-[-0.02em] md:mt-8 md:text-2xl lg:max-w-[88%] lg:ml-auto">
              {right.title}
            </h3>
            <div className="mt-5 grid gap-6 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:mt-6 md:grid-cols-2 md:gap-8 md:text-[0.9375rem] lg:max-w-[88%] lg:ml-auto">
              {right.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
