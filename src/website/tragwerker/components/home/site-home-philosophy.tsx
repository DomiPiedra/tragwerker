import { CmsImage } from "@/website/tragwerker/components/cms-image";

type SiteHomePhilosophyProps = {
  title: string;
  paragraphs: string[];
  imageUrls: [string, string];
};

export function SiteHomePhilosophy({ title, paragraphs, imageUrls }: SiteHomePhilosophyProps) {
  return (
    <section className="site-container py-16 md:py-24 lg:py-28">
      <div className="grid gap-x-8 gap-y-0 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7">
          <div className="relative aspect-[5/3] overflow-hidden bg-[var(--site-line)]">
            <CmsImage
              src={imageUrls[0]}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
          <h2 className="mt-5 font-site-sans text-2xl font-extralight tracking-[-0.02em] text-[#b0b0b0] md:mt-6 md:text-[1.75rem] lg:text-3xl">
            {title}
          </h2>
        </div>

        <div className="mt-10 lg:col-span-5 lg:mt-0 lg:flex lg:flex-col lg:items-end">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--site-line)] lg:w-[90%]">
            <CmsImage
              src={imageUrls[1]}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover"
            />
          </div>
          <div className="mt-5 w-full space-y-4 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)] md:mt-6 md:text-[0.9375rem] lg:w-[90%]">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
