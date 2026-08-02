import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import type { ExpertiseItem } from "@/website/tragwerker/types";

type SiteExpertiseGridProps = {
  eyebrow?: string;
  title: string;
  items: readonly ExpertiseItem[];
};

export function SiteExpertiseGrid({ eyebrow, title, items }: SiteExpertiseGridProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-14 lg:gap-x-24">
          {items.map((item, index) => (
            <SiteReveal key={item.number} delay={index * 0.04}>
              <article className="border-t border-[var(--site-line)] pt-8">
                <div className="flex items-baseline gap-4">
                  <span className="font-site-serif text-2xl text-[var(--site-accent)] md:text-3xl">
                    {item.number}
                  </span>
                  <h3 className="font-site-serif text-2xl tracking-tight md:text-3xl">{item.title}</h3>
                </div>
                <p className="mt-4 text-base leading-relaxed text-[var(--site-muted)]">
                  {item.description}
                </p>
              </article>
            </SiteReveal>
          ))}
        </div>
      </section>
    </SiteReveal>
  );
}
