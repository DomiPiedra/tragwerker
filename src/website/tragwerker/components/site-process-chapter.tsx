import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import type { ProcessChapter, ProcessChapterBlock } from "@/website/tragwerker/kompetenzen-content";
import { cn } from "@/lib/utils";

type SiteProcessChapterProps = {
  chapter: ProcessChapter;
};

function ChapterImage({ block }: { block: Extract<ProcessChapterBlock, { type: "image" }> }) {
  const layout = block.layout ?? "full";

  if (layout === "pair" && block.pairSrc) {
    return (
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <figure>
          <div className="site-media-frame site-media-reveal relative aspect-[4/3] overflow-hidden bg-[var(--site-line)]">
            <CmsImage
              src={block.src}
              alt={block.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn("object-cover", block.objectClass)}
            />
          </div>
          {block.caption ? (
            <figcaption className="font-site-sans text-xs font-extralight text-[var(--site-muted)] md:text-sm">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
        <figure>
          <div className="site-media-frame site-media-reveal relative aspect-[4/3] overflow-hidden bg-[var(--site-line)]">
            <CmsImage
              src={block.pairSrc}
              alt={block.pairAlt ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn("object-cover", block.pairObjectClass)}
            />
          </div>
          {block.pairCaption ? (
            <figcaption className="font-site-sans text-xs font-extralight text-[var(--site-muted)] md:text-sm">
              {block.pairCaption}
            </figcaption>
          ) : null}
        </figure>
      </div>
    );
  }

  return (
    <figure className={cn(layout === "wide" && "md:max-w-4xl")}>
      <div
        className={cn(
          "site-media-frame site-media-reveal relative overflow-hidden bg-[var(--site-line)]",
          layout === "wide" ? "aspect-[16/10]" : "aspect-[16/9] md:aspect-[2.2/1]"
        )}
      >
        <CmsImage
          src={block.src}
          alt={block.alt}
          fill
          sizes={layout === "wide" ? "(max-width: 768px) 100vw, 80vw" : "100vw"}
          className={cn("object-cover", block.objectClass)}
        />
      </div>
      {block.caption ? (
        <figcaption className="font-site-sans text-xs font-extralight text-[var(--site-muted)] md:text-sm">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function SiteProcessChapter({ chapter }: SiteProcessChapterProps) {
  return (
    <SiteReveal>
      <section
        id={chapter.id}
        className="scroll-mt-[calc(var(--site-header-offset)+1.5rem)] border-t border-[var(--site-line)] py-16 md:py-24 lg:py-28"
      >
        <div className="site-container">
          <h2 className="max-w-4xl font-site-sans text-[1.75rem] font-normal leading-[1.2] tracking-[-0.03em] text-[var(--site-ink)] md:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.15]">
            <span className="text-[var(--site-accent)]">{chapter.number}</span>{" "}
            {chapter.title}
          </h2>

          <div className="mt-10 space-y-10 md:mt-14 md:space-y-14 lg:mt-16 lg:space-y-16">
            {chapter.blocks.map((block, index) => {
              if (block.type === "paragraphs") {
                return (
                  <div
                    key={`${chapter.id}-p-${index}`}
                    className="max-w-[65ch] space-y-5 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]"
                  >
                    {block.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 56)}>{paragraph}</p>
                    ))}
                  </div>
                );
              }

              return <ChapterImage key={`${chapter.id}-img-${index}`} block={block} />;
            })}
          </div>
        </div>
      </section>
    </SiteReveal>
  );
}
