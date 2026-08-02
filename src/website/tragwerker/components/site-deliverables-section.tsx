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
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
        <div className="site-grid items-start">
          <p className="site-grid-span-2 font-site-sans text-xs font-extralight uppercase tracking-[0.24em] text-[var(--site-ink)] md:text-sm">
            {eyebrow}
          </p>

          <div className="site-grid-span-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {items.map((item, index) => (
              <SiteReveal key={item.title} delay={index * 0.04}>
                <article className="h-full rounded-xl border border-[var(--site-line)] bg-[var(--site-paper)] px-6 py-6 md:px-7 md:py-7">
                  <h3 className="font-site-sans text-base font-bold tracking-[-0.02em] text-[var(--site-ink)] md:text-lg">
                    {item.title}
                  </h3>
                  <ul className="mt-4 space-y-1.5 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:text-[0.9375rem]">
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
