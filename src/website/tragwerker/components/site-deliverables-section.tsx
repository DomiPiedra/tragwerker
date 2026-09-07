import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

export type DeliverableCard = {
  title: string;
  bullets: readonly string[];
};

type SiteDeliverablesSectionProps = {
  eyebrow: string;
  items: readonly DeliverableCard[];
};

export function SiteDeliverablesSection({ eyebrow, items }: SiteDeliverablesSectionProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <div className="site-grid items-start">
          <p className="site-grid-span-2 font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
            {eyebrow}
          </p>

          <div className="site-grid-span-6 grid gap-px bg-[var(--site-line)] sm:grid-cols-2">
            {items.map((item, index) => (
              <SiteReveal key={item.title} delay={index * 0.04}>
                <article className="h-full bg-[var(--site-surface)] px-6 py-8 md:px-8 md:py-10">
                  <h3 className="font-site-sans text-base font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-lg">
                    {item.title}
                  </h3>
                  <ul className="mt-4 space-y-2 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)]">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              </SiteReveal>
            ))}
          </div>
        </div>
      </section>
    </SiteReveal>
  );
}
