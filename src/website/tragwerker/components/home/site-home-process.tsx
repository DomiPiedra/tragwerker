import type { ProcessStep } from "@/website/tragwerker/types";

type SiteHomeProcessProps = {
  title: string;
  steps: readonly ProcessStep[];
};

export function SiteHomeProcess({ title, steps }: SiteHomeProcessProps) {
  return (
    <section className="site-container py-16 md:py-24 lg:py-28">
      <h2 className="mb-8 font-site-sans text-2xl font-extralight tracking-[-0.02em] text-[#b0b0b0] md:mb-10 md:text-[1.75rem] lg:text-3xl">
        {title}
      </h2>

      <div className="grid gap-px bg-[var(--site-paper)] md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <article
            key={step.number}
            className="bg-[var(--site-surface)] px-8 py-9 md:px-10 md:py-11 lg:px-12"
          >
            <p className="font-site-sans text-xs font-bold tracking-[0.08em] text-[var(--site-ink)] md:text-sm">
              {step.number}
            </p>
            <h3 className="mt-3 font-site-sans text-sm font-bold tracking-[-0.01em] md:mt-4 md:text-base">
              {step.title}
            </h3>
            <p className="mt-3 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:mt-4">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
