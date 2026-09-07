import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";
import type { ProcessStep } from "@/website/tragwerker/types";

type SiteHomeProcessProps = {
  title: string;
  steps: readonly ProcessStep[];
};

export function SiteHomeProcess({ title, steps }: SiteHomeProcessProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <SiteSectionLabel index="005" title="METHODIK" />
        <h2 className="mt-4 max-w-3xl font-site-serif text-3xl font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-4xl">
          {title}
        </h2>

        <div className="mt-10 grid gap-px bg-[var(--site-paper)] md:mt-14 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <SiteReveal key={step.number} delay={index * 0.04}>
              <article className="bg-[var(--site-surface)] px-8 py-8 md:px-10 md:py-10 lg:px-8 xl:px-12">
                <p className="font-site-sans text-xs font-extralight tracking-[0.2em] text-[var(--site-accent)]">
                  {step.number}
                </p>
                <h3 className="mt-3 font-site-sans text-base font-normal tracking-[-0.01em] md:mt-4">
                  {step.title}
                </h3>
                <p className="mt-3 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:mt-4">
                  {step.description}
                </p>
              </article>
            </SiteReveal>
          ))}
        </div>
      </section>
    </SiteReveal>
  );
}
