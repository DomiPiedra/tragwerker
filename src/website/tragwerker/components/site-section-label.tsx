import { cn } from "@/lib/utils";

type SiteSectionLabelProps = {
  index: string;
  title: string;
  className?: string;
};

/** Reference-style section marker: `001 — HOMEPAGE`. */
export function SiteSectionLabel({ index, title, className }: SiteSectionLabelProps) {
  return (
    <p
      className={cn(
        "w-full min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] font-site-sans text-xs font-extralight uppercase tracking-[0.12em] text-[var(--site-muted)] sm:tracking-[0.16em] md:tracking-[0.2em]",
        className
      )}
    >
      <span className="site-label-rule" aria-hidden />
      <span className="text-[var(--site-accent)]">{index}</span>
      <span> — {title}</span>
    </p>
  );
}
