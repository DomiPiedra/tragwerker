import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";

type ProjectCardProps = {
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  excerpt?: string | null;
  location?: string | null;
  period?: string | null;
  year?: number | null;
  heroImageUrl?: string | null;
};

export function ProjectCard({
  slug,
  name,
  category,
  description,
  excerpt,
  location,
  period,
  year,
  heroImageUrl,
}: ProjectCardProps) {
  return (
    <Link href={`/projekte/${slug}`} className="group block">
      <div className="site-media-frame relative aspect-[4/5] overflow-hidden bg-[var(--site-line)]">
        <CmsImage
          src={heroImageUrl ?? SITE_IMAGES.projectFallback}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">{category}</p>
          <h3 className="mt-2 font-site-serif text-xl tracking-[-0.02em] md:text-2xl">{name}</h3>
          {(excerpt ?? description) ? (
            <p className="mt-3 line-clamp-2 font-site-sans text-sm font-extralight leading-relaxed text-[var(--site-muted)]">
              {excerpt ?? description}
            </p>
          ) : null}
        </div>
        <div className="text-right font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
          {period ? <p>{period}</p> : year ? <p>{year}</p> : null}
          {location ? <p className="mt-1">{location}</p> : null}
        </div>
      </div>
    </Link>
  );
}
