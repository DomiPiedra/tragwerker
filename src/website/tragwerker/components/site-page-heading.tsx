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
      <h1 className="max-w-full min-w-0 break-words font-site-sans text-[1.75rem] font-normal leading-[1.25] tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.2]">
        <span
          className={cn(
            "font-medium uppercase tracking-[0.06em]",
            overlay ? "text-white/80" : "text-[var(--site-kicker)]"
          )}
        >
          {pageName}
        </span>{" "}
        <span className={overlay ? "text-white" : "text-[var(--site-ink)]"}>{headline}</span>
      </h1>
      {intro ? (
        <p
          className={cn(
            "mt-6 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed md:mt-8",
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
          ? "border-t border-[var(--site-line)] py-[var(--site-after-hero-y)]"
          : "pb-12 pt-[var(--site-after-hero-y)] md:pb-16",
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
