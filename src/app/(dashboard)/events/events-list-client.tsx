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
  ImageIcon,
  Link2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

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
  mergeLocalDateTime,
  splitLocalDateTime,
  toLocalInputValue,
} from "@/lib/content-site-settings";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createEventQuick, deleteEvent, updateEvent } from "./actions";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  content: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type EventDraft = {
  title: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  content: string;
  heroImageUrl: string;
  galleryUrls: string[];
  published: boolean;
  publishedAt: string;
};

type EventStage = "Upcoming" | "Ongoing" | "Past";

const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });

function eventStage(event: EventRow): EventStage {
  const now = new Date();
  const starts = new Date(event.startsAt);
  const ends = event.endsAt ? new Date(event.endsAt) : null;
  if (starts > now) return "Upcoming";
  if (ends && ends < now) return "Past";
  return "Ongoing";
}

function stageClass(stage: EventStage): string {
  if (stage === "Ongoing") return "bg-emerald-100 text-emerald-800";
  if (stage === "Upcoming") return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

export function EventsListClient({
  initialEvents,
  initialFullViewEventId,
  initialIsFullEventView,
}: {
  initialEvents: EventRow[];
  initialFullViewEventId: string | null;
  initialIsFullEventView: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<EventStage[]>([]);
  const [isPending, startTransition] = useTransition();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();

  const fullViewEventId = initialFullViewEventId;
  const isFullEventView = initialIsFullEventView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "event",
    selectedId ?? (isFullEventView ? fullViewEventId : null)
  );

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const stage = eventStage(event);
      const q = searchQuery.trim().toLowerCase();
      const stageOk = stageFilter.length === 0 || stageFilter.includes(stage);
      const searchOk =
        q.length === 0 ||
        event.title.toLowerCase().includes(q) ||
        event.slug.toLowerCase().includes(q) ||
        (event.location ?? "").toLowerCase().includes(q) ||
        (event.description ?? "").toLowerCase().includes(q) ||
        stage.toLowerCase().includes(q);
      return stageOk && searchOk;
    });
  }, [events, searchQuery, stageFilter]);

  const selected = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      title: selected.title,
      slug: selected.slug,
      startsAt: toLocalInputValue(selected.startsAt),
      endsAt: toLocalInputValue(selected.endsAt),
      location: selected.location ?? "",
      description: selected.description ?? "",
      content: selected.content ?? "",
      heroImageUrl: selected.heroImageUrl ?? "",
      galleryUrls: selected.galleryUrls ?? [],
      published: selected.published,
      publishedAt: toLocalInputValue(selected.publishedAt),
    });
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
    if (!fullViewEventId) return;
    const idx = events.findIndex((event) => event.id === fullViewEventId);
    if (idx >= 0) {
      setSelectedId(fullViewEventId);
      setActiveIndex(idx);
    }
  }, [fullViewEventId, events]);

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
          if (!isFullEventView) closePanelWithAutosave();
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
          if (!isFullEventView && selected) {
            openEventFullView(selected);
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
  }, [activeIndex, filtered, selectedId, selected, draft, isFullEventView]);

  async function persistDraft(
    selectedSnapshot: EventRow | null = selected,
    draftSnapshot: EventDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    const unchanged =
      draftSnapshot.title.trim() === selectedSnapshot.title &&
      draftSnapshot.slug.trim() === selectedSnapshot.slug &&
      draftSnapshot.startsAt.trim() === toLocalInputValue(selectedSnapshot.startsAt) &&
      draftSnapshot.endsAt.trim() === toLocalInputValue(selectedSnapshot.endsAt) &&
      draftSnapshot.location.trim() === (selectedSnapshot.location ?? "") &&
      draftSnapshot.description.trim() === (selectedSnapshot.description ?? "") &&
      draftSnapshot.content.trim() === (selectedSnapshot.content ?? "") &&
      draftSnapshot.heroImageUrl.trim() === (selectedSnapshot.heroImageUrl ?? "") &&
      JSON.stringify(draftSnapshot.galleryUrls) ===
        JSON.stringify(selectedSnapshot.galleryUrls ?? []) &&
      draftSnapshot.published === selectedSnapshot.published &&
      draftSnapshot.publishedAt.trim() === toLocalInputValue(selectedSnapshot.publishedAt);
    if (unchanged) return true;

    const formData = new FormData();
    formData.set("id", selectedSnapshot.id);
    formData.set("title", draftSnapshot.title);
    formData.set("slug", draftSnapshot.slug);
    formData.set("startsAt", draftSnapshot.startsAt);
    formData.set("endsAt", draftSnapshot.endsAt);
    formData.set("location", draftSnapshot.location);
    formData.set("description", draftSnapshot.description);
    formData.set("content", draftSnapshot.content);
    formData.set("heroImageUrl", draftSnapshot.heroImageUrl);
    formData.set("galleryUrls", JSON.stringify(draftSnapshot.galleryUrls));
    formData.set("published", draftSnapshot.published ? "true" : "false");
    formData.set("publishedAt", draftSnapshot.publishedAt);

    const result = await updateEvent(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setEvents((prev) => prev.map((e) => (e.id === result.event.id ? result.event : e)));
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

    const currentIdx = filtered.findIndex((event) => event.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx = (currentIdx + delta + filtered.length) % filtered.length;
    const nextEvent = filtered[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextEvent.id);
    setError(null);

    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectEventPreview(eventId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(eventId);
    if (isFullEventView) {
      router.push(`/events?eventId=${encodeURIComponent(eventId)}`);
    }
  }

  function openEventFullView(event: EventRow) {
    router.push(`/events?eventId=${encodeURIComponent(event.id)}&eventView=full`);
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createEventQuick();
      if (!result.ok) return;
      setEvents((prev) => [result.event, ...prev]);
      setError(null);
      openEventFullView(result.event);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.event, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/events");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteEvent(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/events");
    });
  }

  function updateHeroImage(heroImageUrl: string) {
    setDraft((prev) => (prev ? { ...prev, heroImageUrl } : prev));
  }

  function handleAIEdit(message: string) {
    setError(message);
    window.setTimeout(() => setError((prev) => (prev === message ? null : prev)), 3200);
  }

  function renderEventSiteSettings(): ReactNode {
    if (!selected || !draft) return null;
    return (
      <div className="space-y-6">
        <ContentFullViewPanelSection title="Publishing">
          <ContentSiteSettingsFields
            published={draft.published}
            publishedAt={draft.publishedAt}
            splitPublishedAt={splitLocalDateTime}
            mergePublishedAt={mergeLocalDateTime}
            onPublishedChange={(published) =>
              setDraft((prev) => (prev ? { ...prev, published } : prev))
            }
            onPublishedAtChange={(publishedAt) =>
              setDraft((prev) => (prev ? { ...prev, publishedAt } : prev))
            }
          />
        </ContentFullViewPanelSection>

        <Separator className="bg-black/6" />

        <ContentFullViewPanelSection title="Event">
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
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Starts">
            <Input
              type="datetime-local"
              value={draft.startsAt}
              className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, startsAt: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Ends">
            <Input
              type="datetime-local"
              value={draft.endsAt}
              className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, endsAt: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Location">
            <Input
              value={draft.location}
              className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, location: e.target.value } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Description">
            <textarea
              value={draft.description}
              rows={3}
              className="border-input bg-[#f7f7f7] min-h-[4.5rem] w-full rounded-lg border border-black/8 px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))
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

  function renderEventEditorFields(mode: "preview" | "full" = "preview"): ReactNode {
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
            placeholder="Event title"
            className={contentFullViewTitleClassName}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))
            }
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
            Updated
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
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
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
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-3.5" />
            Starts
          </label>
          <Input
            type="datetime-local"
            value={draft?.startsAt ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, startsAt: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-3.5" />
            Ends
          </label>
          <Input
            type="datetime-local"
            value={draft?.endsAt ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, endsAt: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="size-3.5" />
            Location
          </label>
          <Input
            value={draft?.location ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, location: e.target.value } : prev))}
          />
        </div>

        <ContentSiteSettingsInlineRow
          published={draft?.published ?? false}
          onPublishedChange={(published) =>
            setDraft((prev) => (prev ? { ...prev, published } : prev))
          }
        />

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <CircleDot className="size-3.5" />
            Description
          </label>
          <textarea
            value={draft?.description ?? ""}
            rows={5}
            className="border-input bg-background min-h-[7rem] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))
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

  if (isFullEventView && selected) {
    return (
      <ContentFullViewShell
        title={draft?.title ?? selected.title}
        onBack={exitFullView}
        onRename={focusContentFullViewRename}
        onDelete={handleFullViewDelete}
        settingsContent={renderEventSiteSettings()}
        seoContext={{
          entityType: "event",
          entityId: selected.id,
          title: draft?.title ?? selected.title,
          content: [draft?.description ?? "", draft?.content ?? "", draft?.location ?? ""]
            .filter(Boolean)
            .join("\n\n"),
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          {renderEventEditorFields("full")}
        </div>
      </ContentFullViewShell>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullEventView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullEventView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {events.length} scheduled events
            </p>
          </div>
          <ContentCreateButton
            label="New Event"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullEventView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search events..."
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
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Stage</div>
              {(["Upcoming", "Ongoing", "Past"] as const).map((stage) => (
                <DropdownMenuCheckboxItem
                  key={stage}
                  checked={stageFilter.includes(stage)}
                  onCheckedChange={(checked) =>
                    setStageFilter((prev) =>
                      checked ? [...prev, stage] : prev.filter((s) => s !== stage)
                    )
                  }
                >
                  {stage}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStageFilter([])}>Clear filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullEventView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TITLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STAGE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STARTS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">LOCATION</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event, idx) => {
                  const stage = eventStage(event);
                  return (
                    <TableRow
                      key={event.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el;
                      }}
                      className={cn(
                        "cursor-pointer",
                        activeIndex === idx && "bg-muted/60",
                        selectedId === event.id && "bg-muted"
                      )}
                      onClick={() =>
                        schedulePreview(() => selectEventPreview(event.id, idx))
                      }
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        openFull(() => openEventFullView(event));
                      }}
                    >
                      <TableCell className="px-5 py-3 font-medium">{event.title}</TableCell>
                      <TableCell className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-4 py-1 text-sm", stageClass(stage))}>
                          {stage}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        {dateFmt.format(new Date(event.startsAt))}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-muted-foreground">
                        {event.location || "-"}
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
                          <DropdownMenuContent align="end" className="w-36" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(evt) => {
                                evt.stopPropagation();
                                setSelectedId(event.id);
                                setError(null);
                              }}
                            >
                              <Pencil className="size-4" />
                              Edit item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(evt) => {
                                evt.stopPropagation();
                                startTransition(async () => {
                                  const result = await deleteEvent(event.id);
                                  if (!result.ok) {
                                    setError(result.error);
                                    return;
                                  }
                                  setEvents((prev) => prev.filter((e) => e.id !== event.id));
                                  if (selectedId === event.id) setSelectedId(null);
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

      {selected && !isFullEventView ? (
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
        {selected && !isFullEventView ? (
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
                  onClick={() => openEventFullView(selected)}
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

            {renderEventEditorFields()}
          </>
        ) : null}
      </aside>
    </div>
  );
}

