import Link from "next/link";

import { cn } from "@/lib/utils";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

type Teaser = {
  title: string;
  text: string;
  href: string;
  linkLabel: string;
};

type SiteHomeTeasersProps = {
  items: [Teaser, Teaser];
};

/** Two quiet editorial teasers — mirrors Snøhetta process / sustainability pair. */
export function SiteHomeTeasers({ items }: SiteHomeTeasersProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <div className="grid gap-16 md:grid-cols-2 md:gap-0">
          {items.map((item, index) => (
            <article
              key={item.href}
              className={cn(
                "max-w-md border-t border-[var(--site-line)] pt-8",
                index > 0 && "md:border-l md:pl-12 md:ml-12 lg:pl-16 lg:ml-16"
              )}
            >
              <h2 className="font-site-sans text-xl font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-2xl">
                {item.title}
              </h2>
              <p className="mt-6 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
                {item.text}
              </p>
              <Link
                href={item.href}
                className="site-link mt-8 inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em] md:mt-10"
              >
                {item.linkLabel} →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteReveal>
  );
}
