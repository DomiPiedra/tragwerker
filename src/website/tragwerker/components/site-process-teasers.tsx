import Link from "next/link";

import { cn } from "@/lib/utils";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import type { ProcessTeaser } from "@/website/tragwerker/kompetenzen-content";

type SiteProcessTeasersProps = {
  items: [ProcessTeaser, ProcessTeaser];
};

export function SiteProcessTeasers({ items }: SiteProcessTeasersProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <div className="grid gap-16 md:grid-cols-2 md:gap-0">
          {items.map((item, index) => {
            const external = item.href.startsWith("mailto:") || item.href.startsWith("http");
            const className =
              "site-link mt-8 inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em] md:mt-10";

            return (
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
                {external ? (
                  <a href={item.href} className={className}>
                    {item.linkLabel} →
                  </a>
                ) : (
                  <Link href={item.href} className={className}>
                    {item.linkLabel} →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </SiteReveal>
  );
}
