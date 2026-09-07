import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverted?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p
          className={cn(
            "font-site-sans text-xs font-extralight uppercase tracking-[0.2em]",
            inverted ? "text-white/60" : "text-[var(--site-muted)]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-4 whitespace-pre-line font-site-serif text-3xl leading-[1.12] tracking-[-0.02em] md:text-4xl",
          inverted && "text-[var(--site-paper)]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl font-site-sans text-base font-extralight leading-relaxed",
            inverted ? "text-white/70" : "text-[var(--site-muted)]"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
