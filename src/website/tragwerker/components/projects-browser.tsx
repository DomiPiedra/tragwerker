"use client";

import { useMemo, useState } from "react";

import {
  FeaturedProjectCard,
  ProjectGridCard,
  type ProjectBrowserItem,
} from "@/website/tragwerker/components/project-list-card";
import { ProjectListRow } from "@/website/tragwerker/components/project-list-row";

type ViewMode = "grid" | "list";

type ProjectsBrowserProps = {
  projects: ProjectBrowserItem[];
  categories: string[];
  initialCategory?: string;
};

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 5}
            y={row * 5}
            width="3"
            height="3"
            fill="currentColor"
          />
        )),
      )}
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
      {[2.5, 7, 11.5].map((y) => (
        <g key={y}>
          <circle cx="1.5" cy={y} r="1" fill="currentColor" />
          <rect x="4" y={y - 0.5} width="10" height="1" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

function viewToggleClass(active: boolean) {
  return active
    ? "font-extralight text-[var(--site-ink)]"
    : "font-extralight text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]";
}

function categoryClass(active: boolean) {
  return active
    ? "font-extralight text-[var(--site-ink)]"
    : "font-extralight text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]";
}

function matchesSearch(project: ProjectBrowserItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    project.name,
    project.excerpt,
    project.description,
    project.category,
    project.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export function ProjectsBrowser({ projects, categories, initialCategory }: ProjectsBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory ?? null);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (activeCategory && project.category !== activeCategory) return false;
      return matchesSearch(project, searchQuery);
    });
  }, [projects, activeCategory, searchQuery]);

  const [featured, ...rest] = filtered;

  return (
    <section className="site-container space-y-14 pb-20 md:space-y-16 md:pb-28">
      <div className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex items-center gap-6 font-site-sans text-base font-extralight tracking-[-0.01em] md:gap-8 md:text-lg"
            role="group"
            aria-label="Ansicht"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 ${viewToggleClass(viewMode === "grid")}`}
              aria-pressed={viewMode === "grid"}
            >
              <GridIcon className="size-3.5 shrink-0 md:size-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 ${viewToggleClass(viewMode === "list")}`}
              aria-pressed={viewMode === "list"}
            >
              <ListIcon className="size-3.5 shrink-0 md:size-4" />
              List
            </button>
          </div>

          <label className="flex w-full items-end gap-2 border-b border-[var(--site-line)] sm:ml-auto sm:w-[160px] md:w-[200px]">
            <span className="sr-only">Projekte durchsuchen</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 border-0 bg-transparent py-1.5 font-site-sans text-base font-extralight text-[var(--site-ink)] outline-none placeholder:text-[var(--site-muted)] md:text-lg"
            />
            <span
              className="pb-1.5 font-site-sans text-lg font-extralight leading-none text-[var(--site-muted)] md:text-xl"
              aria-hidden
            >
              +
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 font-site-sans text-base font-extralight md:text-lg">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={categoryClass(activeCategory === null)}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={categoryClass(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-site-sans text-sm font-extralight text-[var(--site-muted)] md:text-base">
          Keine Projekte gefunden.
        </p>
      ) : viewMode === "grid" ? (
        <>
          {featured ? <FeaturedProjectCard {...featured} /> : null}

          {rest.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
              {rest.map((project) => (
                <ProjectGridCard key={project.slug} {...project} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="divide-y divide-[var(--site-line)] border-t border-[var(--site-line)]">
          {filtered.map((project) => (
            <ProjectListRow key={project.slug} {...project} />
          ))}
        </div>
      )}
    </section>
  );
}
