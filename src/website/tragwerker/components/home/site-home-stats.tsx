import type { HomeStat } from "@/website/tragwerker/types";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

type SiteHomeStatsProps = {
  stats: HomeStat[];
};

/** Quiet metadata strip — numbers without dashboard energy. */
export function SiteHomeStats({ stats }: SiteHomeStatsProps) {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-16 md:py-20">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-12">
          {stats.map((stat) => {
            const parts = stat.value.split("\n");
            const primary = parts[0] ?? "";
            const secondary = parts[1];

            const eyebrow = stat.inverted ? stat.label : secondary ? primary : null;
            const value = stat.inverted ? primary : secondary ? secondary : primary;
            const detail = stat.inverted ? secondary : secondary ? stat.label : stat.label;

            return (
              <div key={stat.label}>
                {eyebrow ? (
                  <dt className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
                    {eyebrow}
                  </dt>
                ) : (
                  <dt className="sr-only">{stat.label}</dt>
                )}
                <dd
                  className={
                    eyebrow
                      ? "mt-3 font-site-sans text-2xl font-normal tracking-[-0.03em] text-[var(--site-ink)] md:text-[1.75rem]"
                      : "font-site-sans text-2xl font-normal tracking-[-0.03em] text-[var(--site-ink)] md:text-[1.75rem]"
                  }
                >
                  {value}
                </dd>
                {detail && detail !== value ? (
                  <dd className="mt-2 max-w-[14rem] font-site-sans text-sm font-extralight leading-snug text-[var(--site-muted)]">
                    {detail}
                  </dd>
                ) : null}
              </div>
            );
          })}
        </dl>
      </section>
    </SiteReveal>
  );
}
