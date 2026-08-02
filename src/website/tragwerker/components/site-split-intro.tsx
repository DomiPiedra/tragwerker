import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";

type SiteSplitIntroProps = {
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
  imageSrc?: string | null;
  imageAlt?: string;
  imagePosition?: "left" | "right";
};

export function SiteSplitIntro({
  eyebrow,
  title,
  paragraphs,
  imageSrc,
  imageAlt = "",
  imagePosition = "left",
}: SiteSplitIntroProps) {
  const copy = (
    <div className="flex flex-col justify-center">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-8 space-y-5 text-base leading-relaxed text-[var(--site-muted)] md:text-lg">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
    </div>
  );

  if (!imageSrc) {
    const label = eyebrow ?? title;

    return (
      <SiteReveal>
        <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
          <div className="site-grid items-start">
            <p className="site-grid-span-2 font-site-sans text-xs font-extralight uppercase tracking-[0.24em] text-[var(--site-ink)] md:text-sm">
              {label}
            </p>
            <div className="site-grid-span-5 space-y-6 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)] md:text-lg">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      </SiteReveal>
    );
  }

  const image = (
    <div className="relative aspect-[4/5] overflow-hidden bg-[var(--site-line)] lg:aspect-[5/6]">
      <CmsImage
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );

  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {imagePosition === "left" ? (
            <>
              {image}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {image}
            </>
          )}
        </div>
      </section>
    </SiteReveal>
  );
}
