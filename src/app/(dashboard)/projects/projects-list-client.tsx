"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CircleDot,
  ExternalLink,
  Filter,
  Link2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { ContentCreateButton } from "@/components/content-create-button";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createProjectQuick, deleteProject, updateProject } from "./actions";
import { ProjectStatus } from "@/generated/prisma/enums";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTENT_FULL_VIEW_RENAME_ID,
  ContentFullViewShell,
  focusContentFullViewRename,
} from "@/components/content-full-view-shell";
import { ContentPreviewResizeHandle } from "@/components/content-preview-resize-handle";
import {
  contentPreviewPanelClassName,
  useContentRowClickHandlers,
  usePreviewPanelResize,
} from "@/lib/content-preview-panel";
import { useTrackContentOpen } from "@/hooks/use-track-content-open";
import { cn } from "@/lib/utils";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  author: string;
  category: string;
  status: ProjectStatus;
  description: string | null;
  updatedAt: string;
  createdAt: string;
};

type ProjectDraft = {
  name: string;
  slug: string;
  author: string;
  category: string;
  status: ProjectStatus;
  description: string;
};

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
});

const categories = ["Residential", "Commercial", "Hospitality", "Public"];

const PROJECT_STATUSES = [
  ProjectStatus.Published,
  ProjectStatus.Draft,
  ProjectStatus.InReview,
] as const;

function formatProjectStatusLabel(status: ProjectStatus): string {
  if (status === ProjectStatus.InReview) return "In Review";
  return status;
}

function statusBadgeClass(status: ProjectStatus) {
  if (status === ProjectStatus.Published) return "bg-emerald-100 text-emerald-800";
  if (status === ProjectStatus.InReview) return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

export function ProjectsListClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [authorFilter, setAuthorFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const allAuthors = useMemo(
    () => Array.from(new Set(projects.map((p) => p.author || "Sarah"))).sort(),
    [projects]
  );
  const allCategories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category || "Residential"))).sort(),
    [projects]
  );
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const author = project.author || "Sarah";
        const category = project.category || "Residential";
        const status = project.status ?? ProjectStatus.Draft;
        const statusOk = statusFilter.length === 0 || statusFilter.includes(status);
        const authorOk = authorFilter.length === 0 || authorFilter.includes(author);
        const categoryOk =
          categoryFilter.length === 0 || categoryFilter.includes(category);
        const q = searchQuery.trim().toLowerCase();
        const statusSearch =
          formatProjectStatusLabel(status).toLowerCase() + " " + status.toLowerCase();
        const searchOk =
          q.length === 0 ||
          project.name.toLowerCase().includes(q) ||
          project.slug.toLowerCase().includes(q) ||
          author.toLowerCase().includes(q) ||
          category.toLowerCase().includes(q) ||
          statusSearch.includes(q);
        return statusOk && authorOk && categoryOk && searchOk;
      }),
    [projects, statusFilter, authorFilter, categoryFilter, searchQuery]
  );

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId]
  );
  const fullViewProjectId = searchParams.get("projectId");
  const isFullProjectView = searchParams.get("projectView") === "full";
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "project",
    selectedId ?? (isFullProjectView ? fullViewProjectId : null)
  );

  useEffect(() => {
    if (!fullViewProjectId) return;
    const idx = projects.findIndex((p) => p.id === fullViewProjectId);
    if (idx >= 0) {
      setSelectedId(fullViewProjectId);
      setActiveIndex(idx);
    }
  }, [fullViewProjectId, projects]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      name: selected.name,
      slug: selected.slug,
      author: selected.author || "Sarah",
      category: selected.category || "Residential",
      status: selected.status ?? ProjectStatus.Draft,
      description: selected.description ?? "",
    });
  }, [selected]);

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, filteredProjects.length - 1));
  }, [filteredProjects.length]);

  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (filteredProjects.length === 0) return;

      if (selectedId) {
        if (event.key === "Escape") {
          event.preventDefault();
          closePanelWithAutosave();
          return;
        }
        if (event.key === "ArrowDown" || event.key === "Tab") {
          event.preventDefault();
          moveOpenedSelection(1);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveOpenedSelection(-1);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          if (!isFullProjectView && selected) {
            openProjectFullView(selected);
          }
          return;
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "Tab") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredProjects.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredProjects.length) % filteredProjects.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        setSelectedId(filteredProjects[activeIndex].id);
        setError(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredProjects, isFullProjectView, selected, selectedId, draft]);

  async function persistDraft(
    selectedSnapshot: ProjectRow | null = selected,
    draftSnapshot: ProjectDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;

    const currentDescription = selectedSnapshot.description ?? "";
    const currentAuthor = selectedSnapshot.author ?? "";
    const draftAuthor = draftSnapshot.author ?? "";
    const unchanged =
      draftSnapshot.name.trim() === selectedSnapshot.name &&
      draftSnapshot.slug.trim() === selectedSnapshot.slug &&
      draftAuthor.trim() === currentAuthor &&
      draftSnapshot.category.trim() === (selectedSnapshot.category ?? "Residential") &&
      draftSnapshot.status === (selectedSnapshot.status ?? ProjectStatus.Draft) &&
      draftSnapshot.description.trim() === currentDescription;
    if (unchanged) return true;

    const formData = new FormData();
    formData.set("id", selectedSnapshot.id);
    formData.set("name", draftSnapshot.name);
    formData.set("slug", draftSnapshot.slug);
    formData.set("author", draftAuthor);
    formData.set("category", draftSnapshot.category);
    formData.set("status", draftSnapshot.status);
    formData.set("description", draftSnapshot.description);

    const result = await updateProject(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === result.project.id ? result.project : p))
    );
    setError(null);
    return true;
  }

  function updateProjectInline(id: string, patch: Partial<Pick<ProjectRow, "author" | "category" | "status">>) {
    const current = projects.find((p) => p.id === id);
    if (!current) return;

    const next: ProjectRow = {
      ...current,
      ...patch,
      author: (patch.author ?? current.author ?? "Sarah").trim() || "Sarah",
      category: (patch.category ?? current.category ?? "Residential").trim() || "Residential",
      status: (patch.status ?? current.status ?? ProjectStatus.Draft) as ProjectStatus,
    };

    setProjects((prev) => prev.map((p) => (p.id === id ? next : p)));
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("name", next.name);
      formData.set("slug", next.slug);
      formData.set("author", next.author);
      formData.set("category", next.category);
      formData.set("status", next.status);
      formData.set("description", next.description ?? "");

      const result = await updateProject(formData);
      if (!result.ok) {
        setProjects((prev) => prev.map((p) => (p.id === id ? current : p)));
        setError(result.error);
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === result.project.id ? result.project : p))
      );
      setError(null);
    });
  }

  function closePanelWithAutosave() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function moveOpenedSelection(delta: 1 | -1) {
    if (!selectedId || filteredProjects.length === 0) return;

    const currentIdx = filteredProjects.findIndex((p) => p.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx =
      (currentIdx + delta + filteredProjects.length) % filteredProjects.length;
    const nextProject = filteredProjects[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextProject.id);
    setError(null);

    // Trigger autosave for previously opened project while moving.
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectProjectPreview(projectId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(projectId);
    if (isFullProjectView) {
      router.push(`/projects?projectId=${encodeURIComponent(projectId)}`);
    }
  }

  function openProjectFullView(project: ProjectRow) {
    router.push(
      `/projects?projectId=${encodeURIComponent(project.id)}&projectView=full`
    );
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createProjectQuick();
      if (!result.ok) return;
      setProjects((prev) => [result.project, ...prev]);
      setError(null);
      openProjectFullView(result.project);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.project, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/projects");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteProject(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/projects");
    });
  }

  function renderProjectEditorFields(): ReactNode {
    if (!selected) return null;
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-3.5" />
            Date
          </label>
          <p className="text-sm">{dateFmt.format(new Date(selected.updatedAt))}</p>
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label
            htmlFor={CONTENT_FULL_VIEW_RENAME_ID}
            className="text-muted-foreground flex items-center gap-2 text-sm"
          >
            <CircleDot className="size-3.5" />
            Title
          </label>
          <Input
            id={CONTENT_FULL_VIEW_RENAME_ID}
            value={draft?.name ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
            }
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label
            htmlFor="slug"
            className="text-muted-foreground flex items-center gap-2 text-sm"
          >
            <Link2 className="size-3.5" />
            Slug
          </label>
          <Input
            id="slug"
            value={draft?.slug ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))
            }
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <User className="size-3.5" />
            Author
          </label>
          <Input
            value={draft?.author ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, author: e.target.value } : prev))
            }
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <CircleDot className="size-3.5" />
            Category
          </label>
          <Input
            value={draft?.category ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, category: e.target.value } : prev))
            }
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label
            htmlFor="status"
            className="text-muted-foreground flex items-center gap-2 text-sm"
          >
            <CircleDot className="size-3.5" />
            Status
          </label>
          <select
            id="status"
            value={draft?.status ?? ProjectStatus.Draft}
            onChange={(e) =>
              setDraft((prev) =>
                prev ? { ...prev, status: e.target.value as ProjectStatus } : prev
              )
            }
            className="border-input bg-background h-8 w-full rounded-md border px-2 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatProjectStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label
            htmlFor="description"
            className="text-muted-foreground flex items-center gap-2 pt-1 text-sm"
          >
            <CircleDot className="size-3.5" />
            Description
          </label>
          <textarea
            id="description"
            value={draft?.description ?? ""}
            rows={5}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 min-h-[7rem] w-full rounded-lg border px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3"
            onChange={(e) =>
              setDraft((prev) =>
                prev ? { ...prev, description: e.target.value } : prev
              )
            }
          />
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? (
          <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p>
        ) : null}
      </div>
    );
  }

  if (isFullProjectView && selected) {
    return (
      <ContentFullViewShell
        title={draft?.name ?? selected.name}
        onBack={exitFullView}
        onRename={focusContentFullViewRename}
        onDelete={handleFullViewDelete}
        seoContext={{
          entityType: "project",
          entityId: selected.id,
          title: draft?.name ?? selected.name,
          content: [draft?.category ?? "", draft?.description ?? ""].filter(Boolean).join("\n\n"),
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          {renderProjectEditorFields()}
        </div>
      </ContentFullViewShell>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullProjectView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullProjectView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filteredProjects.length} shown / {projects.length} total projects
            </p>
          </div>
          <ContentCreateButton
            label="New Project"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullProjectView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search projects..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}
                />
              }
            >
              <Filter className="size-4" />
              Filter
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">
                Status
              </div>
              {PROJECT_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) =>
                      checked ? [...prev, status] : prev.filter((s) => s !== status)
                    );
                  }}
                >
                  {formatProjectStatusLabel(status)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">
                Author
              </div>
              {allAuthors.map((author) => (
                <DropdownMenuCheckboxItem
                  key={author}
                  checked={authorFilter.includes(author)}
                  onCheckedChange={(checked) => {
                    setAuthorFilter((prev) =>
                      checked ? [...prev, author] : prev.filter((a) => a !== author)
                    );
                  }}
                >
                  {author}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">
                Category
              </div>
              {allCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={categoryFilter.includes(category)}
                  onCheckedChange={(checked) => {
                    setCategoryFilter((prev) =>
                      checked
                        ? [...prev, category]
                        : prev.filter((c) => c !== category)
                    );
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter([]);
                  setAuthorFilter([]);
                  setCategoryFilter([]);
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullProjectView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TITLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">CATEGORY</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">DATE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">AUTHOR</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project, idx) => {
                  const status = project.status ?? ProjectStatus.Draft;
                  return (
                    <TableRow
                      key={project.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el;
                      }}
                      className={cn(
                        "cursor-pointer",
                        activeIndex === idx && "bg-muted/60",
                        selectedId === project.id && "bg-muted"
                      )}
                      onClick={() =>
                        schedulePreview(() => selectProjectPreview(project.id, idx))
                      }
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        openFull(() => openProjectFullView(project));
                      }}
                    >
                      <TableCell className="px-5 py-3 font-medium">{project.name}</TableCell>
                      <TableCell className="px-5 py-3">
                        <select
                          aria-label="Edit status"
                          value={status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateProjectInline(project.id, {
                              status: e.target.value as ProjectStatus,
                            })
                          }
                          className={cn(
                            "h-8 rounded-full border-0 px-4 pr-8 text-sm font-medium shadow-none outline-none appearance-none focus-visible:ring-0",
                            statusBadgeClass(status)
                          )}
                        >
                          {PROJECT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatProjectStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        <input
                          aria-label="Edit category"
                          defaultValue={project.category || categories[idx % categories.length]}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.currentTarget.value;
                            if ((value ?? "").trim() !== (project.category ?? "").trim()) {
                              updateProjectInline(project.id, { category: value });
                            }
                          }}
                          className="text-muted-foreground h-8 w-full rounded-md border-0 bg-transparent px-0 text-sm shadow-none outline-none focus-visible:ring-0"
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        {dateFmt.format(new Date(project.updatedAt))}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        <input
                          aria-label="Edit author"
                          defaultValue={project.author || "Sarah"}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.currentTarget.value;
                            if ((value ?? "").trim() !== (project.author ?? "").trim()) {
                              updateProjectInline(project.id, { author: value });
                            }
                          }}
                          className="text-muted-foreground h-8 w-full rounded-md border-0 bg-transparent px-0 text-sm shadow-none outline-none focus-visible:ring-0"
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right text-muted-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                                "text-muted-foreground"
                              )}
                              onClick={(event) => event.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-36"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(project.id);
                              setError(null);
                            }}
                          >
                            <Pencil className="size-4" />
                            Edit item
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              startTransition(async () => {
                                const ok = await persistDraft();
                                if (!ok) return;
                                const result = await deleteProject(project.id);
                                if (!result.ok) {
                                  setError(result.error);
                                  return;
                                }
                                setProjects((prev) => prev.filter((p) => p.id !== project.id));
                                if (selectedId === project.id) setSelectedId(null);
                                setError(null);
                              });
                            }}
                          >
                            <Trash2 className="size-4" />
                            Delete item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selected && !isFullProjectView ? (
        <button
          type="button"
          aria-label="Close editor"
          className="fixed inset-0 z-20 bg-transparent"
          onClick={closePanelWithAutosave}
        />
      ) : null}

      <aside
        className={cn(
          contentPreviewPanelClassName("preview", Boolean(selected)),
          isResizing && "!transition-none"
        )}
        style={panelStyle}
      >
        {selected && !isFullProjectView ? (
          <ContentPreviewResizeHandle onMouseDown={startPanelResize} />
        ) : null}
        {selected ? (
          <>
            <div className="mb-7 flex items-center justify-between">
              <h2 className="font-heading text-4xl font-semibold tracking-tight">
                {selected.name || "Title"}
              </h2>
              <div className="flex items-center gap-1">
                {!isFullProjectView ? (
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                    onClick={() => openProjectFullView(selected)}
                    title="Open full view"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                ) : null}
                {!isFullProjectView ? (
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                    onClick={closePanelWithAutosave}
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {renderProjectEditorFields()}
          </>
        ) : null}
      </aside>
    </div>
  );
}
