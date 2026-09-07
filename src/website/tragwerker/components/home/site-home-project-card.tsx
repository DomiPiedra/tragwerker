import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";

import type { ProjectListItemProps } from "@/website/tragwerker/components/project-list-card";

type HomeProjectLayout = "standard" | "wide" | "portrait" | "medium";

const layoutClass: Record<HomeProjectLayout, string> = {
  standard: "aspect-[4/3]",
  wide: "aspect-[16/10] md:aspect-[5/3]",
  portrait: "aspect-[3/4] md:aspect-[4/5]",
  medium: "aspect-[16/10]",
};

export function HomeProjectCard({
  layout,
  slug,
  name,
  location,
  year,
  category,
  heroImageUrl,
  indexLabel,
}: ProjectListItemProps & {
  layout: HomeProjectLayout;
  location?: string | null;
  category?: string | null;
  indexLabel?: string;
}) {
  const meta = [location, year ? String(year) : null, category].filter(Boolean).join(" · ");

  return (
    <Link href={`/projekte/${slug}`} className="group block">
      <div className={`site-media-frame relative overflow-hidden bg-[var(--site-line)] ${layoutClass[layout]}`}>
        <CmsImage
          src={heroImageUrl ?? SITE_IMAGES.projectFallback}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {indexLabel ? (
          <span className="absolute right-4 top-4 bg-[var(--site-paper)]/90 px-2 py-1 font-site-sans text-xs font-extralight tracking-[0.2em] text-[var(--site-muted)]">
            {indexLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <h3 className="min-h-[1.75em] font-site-serif text-xl tracking-[-0.02em] text-[var(--site-ink)] md:text-2xl">
          {name}
        </h3>
        {meta ? (
          <p className="mt-2 font-site-sans text-sm font-extralight text-[var(--site-muted)]">{meta}</p>
        ) : null}
      </div>
    </Link>
  );
}
