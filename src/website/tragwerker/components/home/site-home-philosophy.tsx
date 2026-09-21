import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";

type SiteHomePhilosophyProps = {
  title: string;
  paragraphs: string[];
  focusAreas?: string[];
  imageUrls: string[];
  index?: string;
  label?: string;
};

export function SiteHomePhilosophy({
  title,
  paragraphs,
  focusAreas = [],
  imageUrls,
  index = "002",
  label = "DREI GENERATIONEN",
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

          <div className="mt-8 md:mt-10">
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-x-16">
              <div className={imageUrls.length ? "lg:col-span-6" : "lg:col-span-9"}>
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

              {imageUrls.length > 0 ? (
                <div className="order-first grid gap-6 sm:grid-cols-2 lg:order-last lg:col-span-6 lg:grid-cols-1">
                  {imageUrls.map((src, index) => (
                    <div key={src} className="site-media-reveal overflow-hidden">
                      <CmsImage
                        src={src}
                        alt={`Familie Rausch – drei Generationen Tragwerksplanung, Aufnahme ${index + 1}`}
                        width={1600}
                        height={1200}
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="h-auto w-full"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </SiteReveal>
  );
}
