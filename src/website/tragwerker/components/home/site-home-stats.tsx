import type { HomeStat } from "@/website/tragwerker/types";

type SiteHomeStatsProps = {
  stats: HomeStat[];
};

export function SiteHomeStats({ stats }: SiteHomeStatsProps) {
  return (
    <section className="site-container border-t border-[var(--site-line)] py-12 md:py-16 lg:py-20">
      <dl>
        <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10">
          {stats.map((stat) => (
            <dt
              key={`${stat.label}-top`}
              className="min-h-[1.125rem] font-site-sans text-[0.65rem] font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]"
            >
              {stat.inverted ? stat.label : "\u00A0"}
            </dt>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-x-6 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10">
          {stats.map((stat) => (
            <dd
              key={`${stat.label}-value`}
              className="font-site-sans text-xl font-bold leading-none tracking-[-0.02em] text-[var(--site-ink)] md:text-2xl"
            >
              {stat.value.split("\n")[0]}
            </dd>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10">
          {stats.map((stat) => (
            <dd
              key={`${stat.label}-detail`}
              className="max-w-[12.5rem] font-site-sans text-[0.8125rem] font-extralight leading-snug text-[var(--site-muted)] md:text-sm"
            >
              {stat.inverted ? stat.value.split("\n")[1] : stat.label}
            </dd>
          ))}
        </div>
      </dl>
    </section>
  );
}
