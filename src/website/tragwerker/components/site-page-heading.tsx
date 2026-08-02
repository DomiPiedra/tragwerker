import { cn } from "@/lib/utils";

type SitePageHeadingProps = {
  pageName: string;
  headline: string;
  intro?: string;
  overlay?: boolean;
  className?: string;
};

/** Unified hero/page headline — same type scale everywhere; overlay only changes color via mix-blend. */
export function SitePageHeading({
  pageName,
  headline,
  intro,
  overlay,
  className,
}: SitePageHeadingProps) {
  return (
    <div className={cn(overlay && "mix-blend-difference", className)}>
      <h1 className="max-w-none font-site-sans text-[1.75rem] font-normal leading-[1.25] tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.2]">
        <span className={overlay ? "text-white/70" : "text-[var(--site-muted)]"}>{pageName}</span>{" "}
        <span className={overlay ? "text-white" : "text-[var(--site-ink)]"}>{headline}</span>
      </h1>
      {intro ? (
        <p
          className={cn(
            "mt-6 max-w-3xl font-site-sans text-base font-extralight leading-relaxed md:mt-8 md:text-lg",
            overlay ? "text-white/65" : "text-[var(--site-muted)]"
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

type SitePageHeadingSectionProps = SitePageHeadingProps & {
  placement: "underHero" | "standalone";
  className?: string;
};

export function SitePageHeadingSection({
  pageName,
  headline,
  intro,
  placement,
  className,
}: SitePageHeadingSectionProps) {
  return (
    <section
      className={cn(
        "site-container",
        placement === "underHero"
          ? "border-t border-[var(--site-line)] py-16 md:py-24"
          : "pb-12 pt-16 md:pb-16 md:pt-24",
        className
      )}
    >
      <div className="site-grid">
        <div className="site-grid-span-6">
          <SitePageHeading pageName={pageName} headline={headline} intro={intro} />
        </div>
      </div>
    </section>
  );
}
