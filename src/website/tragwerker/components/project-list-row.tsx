"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";

import type { ProjectListItemProps } from "@/website/tragwerker/components/project-list-card";

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 200;
const PREVIEW_OFFSET = 24;

function listSummary(excerpt?: string | null, description?: string | null) {
  const text = excerpt ?? description ?? "";
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 117).trim()}…` : text;
}

function previewPosition(x: number, y: number) {
  if (typeof window === "undefined") {
    return { left: x + PREVIEW_OFFSET, top: y + PREVIEW_OFFSET };
  }

  const maxLeft = window.innerWidth - PREVIEW_WIDTH - PREVIEW_OFFSET;
  const maxTop = window.innerHeight - PREVIEW_HEIGHT - PREVIEW_OFFSET;

  return {
    left: Math.max(PREVIEW_OFFSET, Math.min(x + PREVIEW_OFFSET, maxLeft)),
    top: Math.max(PREVIEW_OFFSET, Math.min(y + PREVIEW_OFFSET, maxTop)),
  };
}

export function ProjectListRow({
  slug,
  name,
  description,
  excerpt,
  heroImageUrl,
}: ProjectListItemProps) {
  const summary = listSummary(excerpt, description);
  const [hovering, setHovering] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    setPosition(previewPosition(event.clientX, event.clientY));
  }, []);

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    setPosition(previewPosition(event.clientX, event.clientY));
    setHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
  }, []);

  const preview =
    hovering && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-50 hidden overflow-hidden bg-[var(--site-line)] md:block"
            style={{
              left: position.left,
              top: position.top,
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
            }}
            aria-hidden
          >
            <CmsImage
              src={heroImageUrl ?? SITE_IMAGES.projectFallback}
              alt=""
              fill
              sizes={`${PREVIEW_WIDTH}px`}
              className="object-cover"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Link
        href={`/projekte/${slug}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="site-link-quiet block truncate py-5 font-site-sans text-xl font-normal leading-snug tracking-[-0.02em] md:py-6 md:text-2xl"
      >
        <span className="text-[var(--site-ink)]">{name}</span>
        {summary ? <span className="text-[var(--site-muted)]"> {summary}</span> : null}
      </Link>
      {preview}
    </>
  );
}
