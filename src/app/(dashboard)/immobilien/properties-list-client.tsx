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
  Home,
  Link2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
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

import { ContentCreateButton } from "@/components/content-create-button";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createPropertyQuick, deleteProperty, updateProperty } from "./actions";

type PropertyRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  address: string | null;
  priceEur: number | null;
  bedrooms: number | null;
  updatedAt: string;
  createdAt: string;
};

type PropertyDraft = {
  title: string;
  slug: string;
  status: string;
  address: string;
  priceEur: string;
  bedrooms: string;
};

const numberFmt = new Intl.NumberFormat("de-DE");
const dateFmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });
const PROPERTY_STATUSES = ["draft", "active", "sold"] as const;

function statusClass(status: string): string {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "sold") return "bg-blue-100 text-blue-800";
  return "bg-zinc-100 text-zinc-700";
}

export function PropertiesListClient({
  initialProperties,
  initialFullViewPropertyId,
  initialIsFullPropertyView,
}: {
  initialProperties: PropertyRow[];
  initialFullViewPropertyId: string | null;
  initialIsFullPropertyView: boolean;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PropertyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();

  const fullViewPropertyId = initialFullViewPropertyId;
  const isFullPropertyView = initialIsFullPropertyView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "property",
    selectedId ?? (isFullPropertyView ? fullViewPropertyId : null)
  );

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const q = searchQuery.trim().toLowerCase();
      const status = property.status || "draft";
      const statusOk = statusFilter.length === 0 || statusFilter.includes(status);
      const searchOk =
        q.length === 0 ||
        property.title.toLowerCase().includes(q) ||
        property.slug.toLowerCase().includes(q) ||
        (property.address ?? "").toLowerCase().includes(q) ||
        status.toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [properties, searchQuery, statusFilter]);

  const selected = useMemo(
    () => properties.find((property) => property.id === selectedId) ?? null,
    [properties, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      title: selected.title,
      slug: selected.slug,
      status: selected.status || "draft",
      address: selected.address ?? "",
      priceEur: selected.priceEur == null ? "" : String(selected.priceEur),
      bedrooms: selected.bedrooms == null ? "" : String(selected.bedrooms),
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
    if (!fullViewPropertyId) return;
    const idx = properties.findIndex((property) => property.id === fullViewPropertyId);
    if (idx >= 0) {
      setSelectedId(fullViewPropertyId);
      setActiveIndex(idx);
    }
  }, [fullViewPropertyId, properties]);

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
          if (!isFullPropertyView) closePanelWithAutosave();
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
          if (!isFullPropertyView && selected) {
            openPropertyFullView(selected);
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
  }, [activeIndex, filtered, selectedId, selected, draft, isFullPropertyView]);

  async function persistDraft(
    selectedSnapshot: PropertyRow | null = selected,
    draftSnapshot: PropertyDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    const unchanged =
      draftSnapshot.title.trim() === selectedSnapshot.title &&
      draftSnapshot.slug.trim() === selectedSnapshot.slug &&
      draftSnapshot.status.trim() === (selectedSnapshot.status ?? "draft") &&
      draftSnapshot.address.trim() === (selectedSnapshot.address ?? "") &&
      draftSnapshot.priceEur.trim() ===
        (selectedSnapshot.priceEur == null ? "" : String(selectedSnapshot.priceEur)) &&
      draftSnapshot.bedrooms.trim() ===
        (selectedSnapshot.bedrooms == null ? "" : String(selectedSnapshot.bedrooms));
    if (unchanged) return true;

    const formData = new FormData();
    formData.set("id", selectedSnapshot.id);
    formData.set("title", draftSnapshot.title);
    formData.set("slug", draftSnapshot.slug);
    formData.set("status", draftSnapshot.status);
    formData.set("address", draftSnapshot.address);
    formData.set("priceEur", draftSnapshot.priceEur);
    formData.set("bedrooms", draftSnapshot.bedrooms);

    const result = await updateProperty(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setProperties((prev) =>
      prev.map((property) => (property.id === result.property.id ? result.property : property))
    );
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
    const currentIdx = filtered.findIndex((property) => property.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx = (currentIdx + delta + filtered.length) % filtered.length;
    const nextProperty = filtered[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextProperty.id);
    setError(null);

    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectPropertyPreview(propertyId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(propertyId);
    if (isFullPropertyView) {
      router.push(`/immobilien?propertyId=${encodeURIComponent(propertyId)}`);
    }
  }

  function openPropertyFullView(property: PropertyRow) {
    router.push(
      `/immobilien?propertyId=${encodeURIComponent(property.id)}&propertyView=full`
    );
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createPropertyQuick();
      if (!result.ok) return;
      setProperties((prev) => [result.property, ...prev]);
      setError(null);
      openPropertyFullView(result.property);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.property, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/immobilien");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteProperty(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/immobilien");
    });
  }

  function renderPropertyEditorFields(): ReactNode {
    if (!selected) return null;
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
            <Home className="size-3.5" />
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
            <CircleDot className="size-3.5" />
            Status
          </label>
          <select
            value={draft?.status ?? "draft"}
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
            className={cn(
              "h-8 rounded-full border-0 px-4 text-sm font-medium shadow-none outline-none appearance-none",
              statusClass(draft?.status ?? "draft")
            )}
          >
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="size-3.5" />
            Address
          </label>
          <Input
            value={draft?.address ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CircleDot className="size-3.5" />
            Price (EUR)
          </label>
          <Input
            value={draft?.priceEur ?? ""}
            type="number"
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, priceEur: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CircleDot className="size-3.5" />
            Bedrooms
          </label>
          <Input
            value={draft?.bedrooms ?? ""}
            type="number"
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, bedrooms: e.target.value } : prev))}
          />
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? (
          <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p>
        ) : null}
      </div>
    );
  }

  if (isFullPropertyView && selected) {
    return (
      <ContentFullViewShell
        title={draft?.title ?? selected.title}
        onBack={exitFullView}
        onRename={focusContentFullViewRename}
        onDelete={handleFullViewDelete}
        seoContext={{
          entityType: "property",
          entityId: selected.id,
          title: draft?.title ?? selected.title,
          content: [draft?.address ?? "", draft?.status ?? ""].filter(Boolean).join("\n\n"),
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          {renderPropertyEditorFields()}
        </div>
      </ContentFullViewShell>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullPropertyView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullPropertyView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Immobilien</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {properties.length} total listings
            </p>
          </div>
          <ContentCreateButton
            label="New Property"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullPropertyView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search listings..."
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
              {PROPERTY_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) =>
                    setStatusFilter((prev) =>
                      checked ? [...prev, status] : prev.filter((s) => s !== status)
                    )
                  }
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter([])}>Clear filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullPropertyView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TITLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">PRICE (EUR)</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">BEDROOMS</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((property, idx) => (
                  <TableRow
                    key={property.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={cn(
                      "cursor-pointer",
                      activeIndex === idx && "bg-muted/60",
                      selectedId === property.id && "bg-muted"
                    )}
                    onClick={() =>
                      schedulePreview(() => selectPropertyPreview(property.id, idx))
                    }
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      openFull(() => openPropertyFullView(property));
                    }}
                  >
                    <TableCell className="px-5 py-3 font-medium">{property.title}</TableCell>
                    <TableCell className="px-5 py-3">
                      <span className={cn("inline-flex rounded-full px-4 py-1 text-sm", statusClass(property.status))}>
                        {property.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {property.priceEur == null ? "-" : numberFmt.format(property.priceEur)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {property.bedrooms ?? "-"}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(property.id);
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
                                const result = await deleteProperty(property.id);
                                if (!result.ok) {
                                  setError(result.error);
                                  return;
                                }
                                setProperties((prev) => prev.filter((p) => p.id !== property.id));
                                if (selectedId === property.id) setSelectedId(null);
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selected && !isFullPropertyView ? (
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
        {selected && !isFullPropertyView ? (
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
                  onClick={() => openPropertyFullView(selected)}
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

            {renderPropertyEditorFields()}
          </>
        ) : null}
      </aside>
    </div>
  );
}

