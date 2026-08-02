import Link from "next/link";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";

import type { ProjectListItemProps } from "@/website/tragwerker/components/project-list-card";

type HomeProjectLayout = "wide" | "portrait" | "medium";

const layoutClass: Record<HomeProjectLayout, string> = {
  wide: "aspect-[16/10] md:aspect-[5/3]",
  portrait: "aspect-[3/4] md:aspect-[4/5]",
  medium: "aspect-[16/10]",
};

function projectSummary(excerpt?: string | null, description?: string | null) {
  const text = excerpt ?? description ?? "";
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 117).trim()}…` : text;
}

export function HomeProjectCard({
  layout,
  slug,
  name,
  description,
  excerpt,
  heroImageUrl,
}: ProjectListItemProps & { layout: HomeProjectLayout }) {
  const summary = projectSummary(excerpt, description);

  return (
    <Link href={`/projekte/${slug}`} className="group block">
      <div className={`relative overflow-hidden bg-[var(--site-line)] ${layoutClass[layout]}`}>
        <CmsImage
          src={heroImageUrl ?? SITE_IMAGES.projectFallback}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-4 font-site-sans text-sm leading-relaxed md:text-base">
        <span className="font-bold text-[var(--site-ink)]">{name}</span>
        {summary ? (
          <span className="font-extralight text-[var(--site-muted)]"> {summary}</span>
        ) : null}
      </div>
    </Link>
  );
}
