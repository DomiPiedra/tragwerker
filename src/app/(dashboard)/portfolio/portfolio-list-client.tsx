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
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleDot,
  ExternalLink,
  Filter,
  Globe,
  ImageIcon,
  Link2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
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
  contentFullViewTitleClassName,
  focusContentFullViewRename,
} from "@/components/content-full-view-shell";
import {
  ContentFullViewPanelField,
  ContentFullViewPanelSection,
} from "@/components/content-full-view-panel";
import { ContentPreviewResizeHandle } from "@/components/content-preview-resize-handle";
import { Editor } from "@/components/editor/editor";
import { MediaGalleryPicker } from "@/components/media/media-gallery-picker";
import { MediaImagePicker } from "@/components/media/media-image-picker";
import {
  contentPreviewPanelClassName,
  useContentRowClickHandlers,
  usePreviewPanelResize,
} from "@/lib/content-preview-panel";
import { useTrackContentOpen } from "@/hooks/use-track-content-open";
import { cn } from "@/lib/utils";

import { ContentCreateButton } from "@/components/content-create-button";
import {
  ContentSiteSettingsFields,
  ContentSiteSettingsInlineRow,
} from "@/components/content-site-settings-fields";
import {
  isProjectStatusPublished,
  projectStatusFromPublished,
} from "@/lib/content-site-settings";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createPortfolioQuick, deletePortfolioItem, updatePortfolioItem } from "./actions";

type PortfolioRow = {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  summary: string | null;
  content: string | null;
  websiteUrl: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  updatedAt: string;
  createdAt: string;
};

type PortfolioDraft = {
  title: string;
  slug: string;
  status: ProjectStatus;
  summary: string;
  content: string;
  websiteUrl: string;
  heroImageUrl: string;
  galleryUrls: string[];
};

const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });
const STATUSES = [ProjectStatus.Published, ProjectStatus.Draft, ProjectStatus.InReview] as const;

function formatStatus(status: ProjectStatus): string {
  return status === ProjectStatus.InReview ? "In Review" : status;
}

function statusClass(status: ProjectStatus): string {
  if (status === ProjectStatus.Published) return "bg-emerald-100 text-emerald-800";
  if (status === ProjectStatus.InReview) return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

function slugifyTitle(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "item";
}

export function PortfolioListClient({
  initialItems,
  initialFullViewItemId,
  initialIsFullPortfolioView,
}: {
  initialItems: PortfolioRow[];
  initialFullViewItemId: string | null;
  initialIsFullPortfolioView: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [isPending, startTransition] = useTransition();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();
  const slugSyncedRef = useRef(true);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = item.status ?? ProjectStatus.Draft;
      const q = searchQuery.trim().toLowerCase();
      const statusOk = statusFilter.length === 0 || statusFilter.includes(status);
      const searchOk =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.websiteUrl ?? "").toLowerCase().includes(q) ||
        (item.summary ?? "").toLowerCase().includes(q) ||
        formatStatus(status).toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [items, searchQuery, statusFilter]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );
  const fullViewItemId = initialFullViewItemId;
  const isFullPortfolioView = initialIsFullPortfolioView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "portfolioItem",
    selectedId ?? (isFullPortfolioView ? fullViewItemId : null)
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      title: selected.title,
      slug: selected.slug,
      status: selected.status ?? ProjectStatus.Draft,
      summary: selected.summary ?? "",
      content: selected.content ?? "",
      websiteUrl: selected.websiteUrl ?? "",
      heroImageUrl: selected.heroImageUrl ?? "",
      galleryUrls: selected.galleryUrls ?? [],
    });
    slugSyncedRef.current = slugifyTitle(selected.title) === selected.slug;
  }, [selected]);

  useEffect(() => {
    if (filtered.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, filtered.length - 1));
  }, [filtered.length]);

  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  useEffect(() => {
    if (!fullViewItemId) return;
    const idx = items.findIndex((item) => item.id === fullViewItemId);
    if (idx >= 0) {
      setSelectedId(fullViewItemId);
      setActiveIndex(idx);
    }
  }, [fullViewItemId, items]);

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
      if (filtered.length === 0) return;

      if (selectedId) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!isFullPortfolioView) closePanelWithAutosave();
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
          if (!isFullPortfolioView && selected) {
            openItemFullView(selected);
          }
          return;
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "Tab") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        setSelectedId(filtered[activeIndex].id);
        setError(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filtered, selectedId, selected, draft, isFullPortfolioView]);

  async function persistDraft(
    selectedSnapshot: PortfolioRow | null = selected,
    draftSnapshot: PortfolioDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    const unchanged =
      draftSnapshot.title.trim() === selectedSnapshot.title &&
      draftSnapshot.slug.trim() === selectedSnapshot.slug &&
      draftSnapshot.status === selectedSnapshot.status &&
      draftSnapshot.summary.trim() === (selectedSnapshot.summary ?? "") &&
      draftSnapshot.content.trim() === (selectedSnapshot.content ?? "") &&
      draftSnapshot.websiteUrl.trim() === (selectedSnapshot.websiteUrl ?? "") &&
      draftSnapshot.heroImageUrl.trim() === (selectedSnapshot.heroImageUrl ?? "") &&
      JSON.stringify(draftSnapshot.galleryUrls) ===
        JSON.stringify(selectedSnapshot.galleryUrls ?? []);
    if (unchanged) return true;

    const formData = new FormData();
    formData.set("id", selectedSnapshot.id);
    formData.set("title", draftSnapshot.title);
    formData.set("slug", draftSnapshot.slug);
    formData.set("status", draftSnapshot.status);
    formData.set("summary", draftSnapshot.summary);
    formData.set("content", draftSnapshot.content);
    formData.set("websiteUrl", draftSnapshot.websiteUrl);
    formData.set("heroImageUrl", draftSnapshot.heroImageUrl);
    formData.set("galleryUrls", JSON.stringify(draftSnapshot.galleryUrls));

    const result = await updatePortfolioItem(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setItems((prev) => prev.map((item) => (item.id === result.item.id ? result.item : item)));
    setError(null);
    return true;
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
    if (!selectedId || filtered.length === 0) return;

    const currentIdx = filtered.findIndex((item) => item.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx = (currentIdx + delta + filtered.length) % filtered.length;
    const nextItem = filtered[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextItem.id);
    setError(null);

    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectItemPreview(itemId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(itemId);
    if (isFullPortfolioView) {
      router.push(`/portfolio?itemId=${encodeURIComponent(itemId)}`);
    }
  }

  function openItemFullView(item: PortfolioRow) {
    router.push(`/portfolio?itemId=${encodeURIComponent(item.id)}&portfolioView=full`);
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createPortfolioQuick();
      if (!result.ok) return;
      setItems((prev) => [result.item, ...prev]);
      setError(null);
      openItemFullView(result.item);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.portfolio, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/portfolio");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deletePortfolioItem(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/portfolio");
    });
  }

  function updateDraftTitle(title: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        title,
        slug: slugSyncedRef.current ? slugifyTitle(title) : prev.slug,
      };
    });
  }

  function updateDraftSlug(slug: string) {
    slugSyncedRef.current = false;
    setDraft((prev) => (prev ? { ...prev, slug } : prev));
  }

  function updateHeroImage(heroImageUrl: string) {
    setDraft((prev) => (prev ? { ...prev, heroImageUrl } : prev));
  }

  function handleAIEdit(message: string) {
    setError(message);
    window.setTimeout(() => setError((prev) => (prev === message ? null : prev)), 3200);
  }

  function renderPortfolioSiteSettings(): ReactNode {
    if (!selected || !draft) return null;
    return (
      <div className="space-y-6">
        <ContentFullViewPanelSection title="Publishing">
          <ContentSiteSettingsFields
            published={isProjectStatusPublished(draft.status)}
            onPublishedChange={(published) =>
              setDraft((prev) =>
                prev ? { ...prev, status: projectStatusFromPublished(published) } : prev
              )
            }
          />
        </ContentFullViewPanelSection>

        <Separator className="bg-black/6" />

        <ContentFullViewPanelSection title="Portfolio">
          <ContentFullViewPanelField label="Updated">
            <p className="text-muted-foreground text-[13px]">
              {dateFmt.format(new Date(selected.updatedAt))}
            </p>
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Slug">
            <Input
              value={draft.slug}
              required
              className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
              onChange={(e) => updateDraftSlug(e.target.value)}
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Website">
            <Input
              value={draft.websiteUrl}
              className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, websiteUrl: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Summary">
            <textarea
              value={draft.summary}
              rows={3}
              className="border-input bg-[#f7f7f7] min-h-[4.5rem] w-full rounded-lg border border-black/8 px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, summary: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Hero image">
            <MediaImagePicker
              value={draft.heroImageUrl}
              variant="cover"
              placeholder="Choose hero image"
              onChange={updateHeroImage}
            />
          </ContentFullViewPanelField>
        </ContentFullViewPanelSection>
      </div>
    );
  }

  function renderPortfolioEditorFields(mode: "preview" | "full" = "preview"): ReactNode {
    if (!selected) return null;

    if (mode === "full") {
      return (
        <div className="space-y-6">
          <MediaImagePicker
            value={draft?.heroImageUrl ?? ""}
            variant="banner"
            placeholder="Add hero image"
            onChange={updateHeroImage}
          />

          <textarea
            id={CONTENT_FULL_VIEW_RENAME_ID}
            value={draft?.title ?? ""}
            required
            rows={1}
            placeholder="Portfolio title"
            className={contentFullViewTitleClassName}
            onChange={(e) => updateDraftTitle(e.target.value)}
          />

          <div className="relative min-h-[50vh] [&_.prose-premium]:leading-6 [&_.prose-premium_p]:my-0">
            <Editor
              value={draft?.content ?? ""}
              onChange={(nextContent) =>
                setDraft((prev) => (prev ? { ...prev, content: nextContent } : prev))
              }
              handleAIEdit={handleAIEdit}
              className="prose-premium-canvas"
              placeholder="press / to add text, images, and more"
            />
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
          {isPending ? (
            <p className="text-muted-foreground text-xs">Saving changes…</p>
          ) : null}
        </div>
      );
    }

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
            value={draft?.title ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => updateDraftTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link2 className="size-3.5" />
            Slug
          </label>
          <Input
            value={draft?.slug ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => updateDraftSlug(e.target.value)}
          />
        </div>

        <ContentSiteSettingsInlineRow
          published={isProjectStatusPublished(draft?.status ?? ProjectStatus.Draft)}
          onPublishedChange={(published) =>
            setDraft((prev) =>
              prev ? { ...prev, status: projectStatusFromPublished(published) } : prev
            )
          }
        />

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <Globe className="size-3.5" />
            Website
          </label>
          <Input
            value={draft?.websiteUrl ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, websiteUrl: e.target.value } : prev))
            }
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <CircleDot className="size-3.5" />
            Summary
          </label>
          <textarea
            value={draft?.summary ?? ""}
            rows={5}
            className="border-input bg-background min-h-[7rem] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, summary: e.target.value } : prev))
            }
          />
        </div>

        <div className="pt-4">
          <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
            Media
          </h3>
          <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
            <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
              <ImageIcon className="size-3.5" />
              Hero image
            </label>
            <MediaImagePicker
              value={draft?.heroImageUrl ?? ""}
              variant="cover"
              placeholder="Choose hero image"
              onChange={updateHeroImage}
            />
          </div>
          <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
            <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
              <ImageIcon className="size-3.5" />
              Gallery
            </label>
            <MediaGalleryPicker
              value={draft?.galleryUrls ?? []}
              onChange={(galleryUrls) =>
                setDraft((prev) => (prev ? { ...prev, galleryUrls } : prev))
              }
            />
          </div>
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? (
          <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p>
        ) : null}
      </div>
    );
  }

  if (isFullPortfolioView && selected) {
    return (
      <ContentFullViewShell
        title={draft?.title ?? selected.title}
        onBack={exitFullView}
        onRename={focusContentFullViewRename}
        onDelete={handleFullViewDelete}
        settingsContent={renderPortfolioSiteSettings()}
        seoContext={{
          entityType: "portfolioItem",
          entityId: selected.id,
          title: draft?.title ?? selected.title,
          content: [draft?.summary ?? "", draft?.content ?? "", draft?.websiteUrl ?? ""]
            .filter(Boolean)
            .join("\n\n"),
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          {renderPortfolioEditorFields("full")}
        </div>
      </ContentFullViewShell>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullPortfolioView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullPortfolioView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {items.length} total items
            </p>
          </div>
          <ContentCreateButton
            label="New Portfolio"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullPortfolioView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search portfolio..."
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
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Status</div>
              {STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) =>
                    setStatusFilter((prev) =>
                      checked ? [...prev, status] : prev.filter((s) => s !== status)
                    )
                  }
                >
                  {formatStatus(status)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter([])}>
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullPortfolioView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TITLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">WEBSITE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">DATE</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => {
                  const status = item.status ?? ProjectStatus.Draft;
                  return (
                    <TableRow
                      key={item.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el;
                      }}
                      className={cn(
                        "cursor-pointer",
                        activeIndex === idx && "bg-muted/60",
                        selectedId === item.id && "bg-muted"
                      )}
                      onClick={() =>
                        schedulePreview(() => selectItemPreview(item.id, idx))
                      }
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        openFull(() => openItemFullView(item));
                      }}
                    >
                      <TableCell className="px-5 py-3 font-medium">{item.title}</TableCell>
                      <TableCell className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-4 py-1 text-sm", statusClass(status))}>
                          {formatStatus(status)}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        {item.websiteUrl || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        {dateFmt.format(new Date(item.updatedAt))}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right text-muted-foreground">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
                                onClick={(event) => event.stopPropagation()}
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedId(item.id);
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
                                  const result = await deletePortfolioItem(item.id);
                                  if (!result.ok) {
                                    setError(result.error);
                                    return;
                                  }
                                  setItems((prev) => prev.filter((p) => p.id !== item.id));
                                  if (selectedId === item.id) setSelectedId(null);
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

      {selected && !isFullPortfolioView ? (
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
        {selected && !isFullPortfolioView ? (
          <ContentPreviewResizeHandle onMouseDown={startPanelResize} />
        ) : null}
        {selected ? (
          <>
            <div className="mb-7 flex items-center justify-between">
              <h2 className="font-heading text-4xl font-semibold tracking-tight">
                {selected.title || "Title"}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  onClick={() => openItemFullView(selected)}
                  title="Open full view"
                >
                  <ExternalLink className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  onClick={closePanelWithAutosave}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {renderPortfolioEditorFields()}
          </>
        ) : null}
      </aside>
    </div>
  );
}

