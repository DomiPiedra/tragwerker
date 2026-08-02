"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { cn } from "@/lib/utils";

export type HomeHeroProject = {
  slug: string;
  name: string;
  heroImageUrl?: string | null;
  location?: string | null;
  category?: string | null;
  excerpt?: string | null;
  description?: string | null;
};

type SiteHomeHeroProps = {
  statement: string;
  projects: HomeHeroProject[];
};

const ease = [0.22, 1, 0.36, 1] as const;

/** Staggered slide layouts — mirrors Snøhetta rhythm (mixed aspect + vertical offset). */
const SLIDE_LAYOUTS = [
  { widthVw: 40, heightPct: 72, topPct: 0 },
  { widthVw: 48, heightPct: 90, topPct: 10 },
  { widthVw: 30, heightPct: 94, topPct: 6 },
  { widthVw: 38, heightPct: 76, topPct: 0 },
  { widthVw: 34, heightPct: 84, topPct: 12 },
  { widthVw: 44, heightPct: 86, topPct: 8 },
] as const;

function projectCaption(project: HomeHeroProject) {
  if (project.location?.trim()) return project.location.trim();
  if (project.category?.trim()) return project.category.trim();
  const text = project.excerpt ?? project.description;
  if (!text) return null;
  return text.length > 72 ? `${text.slice(0, 69).trim()}…` : text;
}

function layoutFor(index: number) {
  return SLIDE_LAYOUTS[index % SLIDE_LAYOUTS.length]!;
}

export function SiteHomeHero({ statement, projects }: SiteHomeHeroProps) {
  const slides = projects;
  const count = slides.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [activeWidth, setActiveWidth] = useState(0);
  const rafRef = useRef(0);

  const updateActive = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || count === 0) return;

    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let bestIndex = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestWidth = 0;

    slideRefs.current.forEach((el, index) => {
      if (!el) return;
      const slideCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(slideCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = index;
        bestWidth = el.offsetWidth;
      }
    });

    setActive((prev) => (prev === bestIndex ? prev : bestIndex));
    setActiveWidth(bestWidth);
  }, [count]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActive);
    };

    updateActive();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      cancelAnimationFrame(rafRef.current);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateActive);
    };
  }, [updateActive, count]);

  // Vertical wheel → horizontal scroll while hovering the strip (Snøhetta-like).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 0) return;
      const atStart = scroller.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = scroller.scrollLeft >= max - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      scroller.scrollLeft += event.deltaY;
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [count]);

  const current = slides[active];

  return (
    <section className="relative flex min-h-[calc(100svh-var(--site-header-offset))] flex-col overflow-hidden bg-[var(--site-paper)]">
      <div className="site-container pt-4 md:pt-8 lg:pt-10">
        <motion.h1
          className="max-w-[22ch] font-site-sans text-[1.75rem] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--site-ink)] md:max-w-[30ch] md:text-[2.5rem] lg:max-w-[36ch] lg:text-[3.25rem] lg:leading-[1.1]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          {statement}
        </motion.h1>
      </div>

      <div className="mt-auto w-full pb-10 pt-12 md:pb-14 md:pt-16 lg:pb-16 lg:pt-20">
        {count === 0 ? (
          <div className="site-container">
            <div className="relative mx-auto aspect-[16/10] w-full max-w-3xl overflow-hidden bg-[var(--site-line)]">
              <CmsImage
                src={SITE_IMAGES.projectFallback}
                alt=""
                fill
                sizes="80vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.12 }}
          >
            <div
              ref={scrollerRef}
              className={cn(
                "relative h-[min(52vw,400px)] touch-pan-x overflow-x-auto overflow-y-hidden md:h-[min(44vw,480px)] lg:h-[min(40vw,520px)]",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                "snap-x snap-mandatory"
              )}
            >
              <div className="flex h-full w-max items-start">
                {/* Leading spacer so first slide can center */}
                <div
                  className="shrink-0 snap-none"
                  style={{ width: `calc(50vw - ${(layoutFor(0).widthVw / 2).toFixed(2)}vw)` }}
                  aria-hidden
                />

                {slides.map((project, index) => {
                  const layout = layoutFor(index);
                  const isActive = index === active;
                  return (
                    <article
                      key={project.slug}
                      ref={(el) => {
                        slideRefs.current[index] = el;
                      }}
                      className="relative h-full shrink-0 snap-center"
                      style={{ width: `${layout.widthVw}vw` }}
                    >
                      <div
                        className="absolute inset-x-0 overflow-hidden bg-[var(--site-line)]"
                        style={{
                          top: `${layout.topPct}%`,
                          height: `${layout.heightPct}%`,
                        }}
                      >
                        <Link
                          href={`/projekte/${project.slug}`}
                          className="relative block h-full w-full"
                          draggable={false}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <CmsImage
                            src={project.heroImageUrl ?? SITE_IMAGES.projectFallback}
                            alt={project.name}
                            fill
                            priority={index < 4}
                            sizes={`${layout.widthVw}vw`}
                            className="pointer-events-none object-cover"
                          />
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {/* Trailing spacer so last slide can center */}
                <div
                  className="shrink-0 snap-none"
                  style={{
                    width: `calc(50vw - ${(layoutFor(Math.max(count - 1, 0)).widthVw / 2).toFixed(2)}vw)`,
                  }}
                  aria-hidden
                />
              </div>
            </div>

            {current ? (
              <div className="mt-4 md:mt-5">
                <motion.div
                  key={current.slug}
                  className="mx-auto text-left"
                  style={{
                    width: activeWidth > 0 ? activeWidth : `${layoutFor(active).widthVw}vw`,
                    maxWidth: "90vw",
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <Link
                    href={`/projekte/${current.slug}`}
                    className="font-site-sans text-sm tracking-[-0.01em] text-[var(--site-ink)] transition-opacity hover:opacity-60 md:text-[0.9375rem]"
                  >
                    {current.name}
                  </Link>
                  {projectCaption(current) ? (
                    <p className="mt-0.5 font-site-sans text-xs font-extralight text-[var(--site-muted)] md:text-sm">
                      {projectCaption(current)}
                    </p>
                  ) : null}
                </motion.div>
              </div>
            ) : null}

            <div className="sr-only" aria-live="polite">
              Projekt {active + 1} von {count}: {current?.name}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
