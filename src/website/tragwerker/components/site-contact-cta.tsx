import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

type SiteContactCtaProps = {
  headline: string;
  text: string;
  buttonLabel: string;
  mailto?: string;
  href?: string;
};

export function SiteContactCta({ headline, text, buttonLabel, mailto, href }: SiteContactCtaProps) {
  const actionHref = href ?? (mailto ? `mailto:${mailto}` : undefined);

  return (
    <SiteReveal>
      <section className="bg-[var(--site-ink)] py-20 text-[var(--site-paper)] md:py-28 lg:py-32">
        <div className="site-container mx-auto max-w-3xl text-center">
          <h2 className="font-site-sans text-[1.75rem] font-normal leading-tight tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.75rem]">
            {headline}
          </h2>
          <p className="mx-auto mt-6 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-white/65">
            {text}
          </p>
          {actionHref ? (
            <a
              href={actionHref}
              className="mt-10 inline-flex min-h-11 items-center border border-[var(--site-paper)] px-6 py-3 font-site-sans text-base font-light tracking-[-0.01em] text-[var(--site-paper)] transition-colors duration-200 hover:bg-[var(--site-paper)] hover:text-[var(--site-ink)] md:mt-12"
            >
              {buttonLabel}
            </a>
          ) : null}
        </div>
      </section>
    </SiteReveal>
  );
}
