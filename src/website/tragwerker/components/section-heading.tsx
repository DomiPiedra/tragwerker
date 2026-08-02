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
            "text-xs uppercase tracking-[0.28em]",
            inverted ? "text-white/60" : "text-[var(--site-accent)]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-3 whitespace-pre-line font-site-serif text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl",
          inverted && "text-[var(--site-paper)]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed md:text-lg",
            inverted ? "text-white/70" : "text-[var(--site-muted)]"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
