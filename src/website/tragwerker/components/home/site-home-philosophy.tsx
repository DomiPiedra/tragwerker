import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";

type SiteHomePhilosophyProps = {
  title: string;
  paragraphs: string[];
  focusAreas?: string[];
  imageUrl: string;
  index?: string;
  label?: string;
};

export function SiteHomePhilosophy({
  title,
  paragraphs,
  focusAreas = [],
  imageUrl,
  index = "004",
  label = "KONSTRUKTIVE HALTUNG",
}: SiteHomePhilosophyProps) {
  const [lead, ...rest] = paragraphs;
  const mid = Math.ceil(focusAreas.length / 2);
  const focusLeft = focusAreas.slice(0, mid);
  const focusRight = focusAreas.slice(mid);

  return (
    <SiteReveal>
      <section className="py-20 md:py-28 lg:py-32">
        <div className="site-container">
          <SiteSectionLabel index={index} title={label} />

          <div className="mt-8 bg-[var(--site-surface)] px-6 py-10 md:mt-10 md:px-10 md:py-14 lg:px-14 lg:py-16">
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-x-16">
              <div className="lg:col-span-6">
                <h2 className="font-site-serif text-3xl font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-4xl">
                  {title}
                </h2>
                {lead ? (
                  <p className="mt-8 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)] md:mt-10">
                    {lead}
                  </p>
                ) : null}
                <div className="mt-4 space-y-4 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
                  {rest.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>

                {focusAreas.length > 0 ? (
                  <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-2 font-site-sans text-sm font-extralight text-[var(--site-ink)] md:mt-12">
                    <ul className="space-y-2">
                      {focusLeft.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <ul className="space-y-2">
                      {focusRight.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-6">
                <div className="site-media-frame site-media-reveal relative aspect-[4/5] overflow-hidden bg-[var(--site-line)] md:aspect-[5/6]">
                  <CmsImage
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteReveal>
  );
}
