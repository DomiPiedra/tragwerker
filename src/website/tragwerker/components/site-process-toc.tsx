"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { ProcessChapter } from "@/website/tragwerker/kompetenzen-content";

type SiteProcessTocProps = {
  chapters: ProcessChapter[];
};

/** Sticky bottom TOC in a glass card — floats over chapter content. */
export function SiteProcessToc({ chapters }: SiteProcessTocProps) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elements = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visibleEntries[0]?.target.id;
        if (top) setActiveId(top);
      },
      { rootMargin: "-15% 0px -40% 0px", threshold: [0.1, 0.35, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters]);

  // Show once the first chapter enters view; hide again near page end teasers.
  useEffect(() => {
    const first = document.getElementById(chapters[0]?.id ?? "");
    const end = document.getElementById("kompetenzen-end");
    if (!first) return;

    const sync = () => {
      const firstTop = first.getBoundingClientRect().top;
      const pastStart = firstTop < window.innerHeight * 0.85;
      const nearEnd = end ? end.getBoundingClientRect().top < window.innerHeight * 0.75 : false;
      setVisible(pastStart && !nearEnd);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [chapters]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 md:px-6 md:pb-5",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      aria-hidden={!visible}
    >
      <nav
        aria-label="Inhaltsverzeichnis"
        className={cn(
          "site-process-toc-glass pointer-events-auto w-full max-w-5xl overflow-hidden",
          !visible && "pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 md:gap-4 md:px-5 md:py-3.5">
          <p className="hidden shrink-0 font-site-sans text-[0.65rem] font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)] sm:block">
            Inhalt
          </p>
          <ol className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2">
            {chapters.map((chapter) => {
              const active = chapter.id === activeId;
              return (
                <li key={chapter.id} className="shrink-0">
                  <a
                    href={`#${chapter.id}`}
                    className={cn(
                      "inline-flex items-baseline gap-1.5 rounded-sm px-2.5 py-1.5 font-site-sans text-xs tracking-[-0.015em] transition-colors md:gap-2 md:px-3 md:text-sm",
                      active
                        ? "bg-[var(--site-ink)]/8 text-[var(--site-ink)]"
                        : "text-[var(--site-muted)] hover:text-[var(--site-ink)]"
                    )}
                    tabIndex={visible ? 0 : -1}
                  >
                    <span className="tabular-nums opacity-60">{chapter.number}</span>
                    <span className="max-w-[9rem] truncate md:max-w-[12rem] lg:max-w-none">
                      {chapter.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </div>
  );
}
