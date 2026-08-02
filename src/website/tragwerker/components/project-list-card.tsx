import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";

export type ProjectListItemProps = {
  slug: string;
  name: string;
  description?: string | null;
  excerpt?: string | null;
  period?: string | null;
  year?: number | null;
  heroImageUrl?: string | null;
};

export type ProjectBrowserItem = ProjectListItemProps & {
  category: string;
  location?: string | null;
};

function projectSummary(excerpt?: string | null, description?: string | null) {
  const text = excerpt ?? description ?? "";
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 117).trim()}…` : text;
}

function projectYearLabel(period?: string | null, year?: number | null) {
  if (period) return period;
  if (year) return String(year);
  return null;
}

export function FeaturedProjectCard({
  slug,
  name,
  description,
  excerpt,
  period,
  year,
  heroImageUrl,
}: ProjectListItemProps) {
  const summary = projectSummary(excerpt, description);
  const badge = projectYearLabel(period, year);
  const yearLabel = year ? String(year) : null;

  return (
    <Link href={`/projekte/${slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--site-line)] md:aspect-[8/3] lg:aspect-[4/1]">
        <CmsImage
          src={heroImageUrl ?? SITE_IMAGES.projectFallback}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        {badge ? (
          <span className="absolute left-1/2 top-5 -translate-x-1/2 bg-white px-3 py-1.5 text-xs tracking-[-0.01em] text-[var(--site-ink)] md:top-6">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 font-site-sans text-sm leading-relaxed md:text-base">
        <span className="text-[var(--site-muted)]">{name}</span>
        {summary ? <span className="text-[var(--site-ink)]"> {summary}</span> : null}
        {yearLabel ? <span className="mt-2 block text-[var(--site-ink)]">{yearLabel}</span> : null}
      </div>
    </Link>
  );
}

export function ProjectGridCard({
  slug,
  name,
  description,
  excerpt,
  period,
  year,
  heroImageUrl,
}: ProjectListItemProps) {
  const summary = projectSummary(excerpt, description);
  const badge = projectYearLabel(period, year);
  const yearLabel = year ? String(year) : null;

  return (
    <Link href={`/projekte/${slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--site-line)]">
        <CmsImage
          src={heroImageUrl ?? SITE_IMAGES.projectFallback}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        {badge ? (
          <span className="absolute right-3 top-3 bg-white px-2.5 py-1 text-xs tracking-[-0.01em] text-[var(--site-ink)]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 font-site-sans text-sm leading-relaxed md:text-base">
        <span className="text-[var(--site-muted)]">{name}</span>
        {summary ? <span className="text-[var(--site-ink)]"> {summary}</span> : null}
        {yearLabel ? <span className="mt-2 block text-[var(--site-ink)]">{yearLabel}</span> : null}
      </div>
    </Link>
  );
}
