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
      <section className="bg-[var(--site-ink)] py-20 text-[var(--site-paper)] md:py-28">
        <div className="site-container mx-auto max-w-3xl text-center">
          <h2 className="font-site-sans text-[1.75rem] font-bold leading-tight tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.75rem]">
            {headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-site-sans text-sm font-extralight leading-relaxed text-white/65 md:mt-6 md:text-base">
            {text}
          </p>
          {actionHref ? (
            <a
              href={actionHref}
              className="mt-10 inline-block font-site-sans text-sm font-extralight tracking-[-0.01em] text-white/55 transition-colors hover:text-white md:mt-12 md:text-base"
            >
              {buttonLabel}
            </a>
          ) : null}
        </div>
      </section>
    </SiteReveal>
  );
}
