import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import type { ProcessStep } from "@/website/tragwerker/types";

type SiteProcessSectionProps = {
  eyebrow?: string;
  title?: string;
  steps: readonly ProcessStep[];
};

export function SiteProcessSection({ eyebrow, steps }: SiteProcessSectionProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
        <div className="site-grid items-start">
          {eyebrow ? (
            <p className="site-grid-span-2 font-site-sans text-xs font-extralight uppercase tracking-[0.24em] text-[var(--site-ink)] md:text-sm">
              {eyebrow}
            </p>
          ) : (
            <div className="site-grid-span-2" />
          )}

          <div className="site-grid-span-6 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
            {steps.map((step, index) => (
              <SiteReveal key={step.number} delay={index * 0.05}>
                <article className="grid gap-4 py-8 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] md:gap-10 md:py-10 lg:gap-14">
                  <div>
                    <p className="font-site-sans text-xs font-extralight tracking-[-0.01em] text-[var(--site-muted)] md:text-sm">
                      {step.number}
                    </p>
                    <h3 className="mt-2 font-site-sans text-lg font-bold leading-snug tracking-[-0.02em] text-[var(--site-ink)] md:text-xl">
                      {step.title}
                    </h3>
                  </div>
                  <p className="font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:text-base">
                    {step.description}
                  </p>
                </article>
              </SiteReveal>
            ))}
          </div>
        </div>
      </section>
    </SiteReveal>
  );
}
