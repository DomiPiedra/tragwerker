"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { ClipboardEvent } from "react";
import {
  CheckSquare,
  Filter,
  FolderPlus,
  Grid3X3,
  ImageIcon,
  List,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { createMediaFolder, deleteMediaAssets, moveMediaToFolder, updateMediaAsset } from "./actions";
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
import { cn } from "@/lib/utils";

type MediaRow = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  title: string;
  altText: string | null;
  tags: string[];
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FolderRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = "list" | "grid";
type DateFilter = "all" | "today" | "last7";
type MediaTypeFilter = "all" | "image" | "video" | "document";
type FolderFilter = "all" | "unfiled" | string;

const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });

function bytesLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function mediaTypeFromMime(mimeType: string): MediaTypeFilter {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export function MediaBrowserClient({
  initialMedia,
  initialFolders,
}: {
  initialMedia: MediaRow[];
  initialFolders: FolderRow[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [folders, setFolders] = useState(initialFolders);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploadDragging, setIsUploadDragging] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [draggedItemIds, setDraggedItemIds] = useState<string[]>([]);
  const [activeDropFolder, setActiveDropFolder] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(media.flatMap((item) => item.tags))).sort((a, b) => a.localeCompare(b)),
    [media]
  );

  const filtered = useMemo(() => {
    return media.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const itemType = mediaTypeFromMime(item.mimeType);
      const typeOk = typeFilter === "all" || itemType === typeFilter;
      const folderOk =
        folderFilter === "all"
          ? true
          : folderFilter === "unfiled"
            ? !item.folderId
            : item.folderId === folderFilter;
      const tagsOk = tagFilter.length === 0 || tagFilter.every((tag) => item.tags.includes(tag));
      const createdAtTime = new Date(item.createdAt).getTime();
      const dateOk =
        dateFilter === "all" ||
        (dateFilter === "today" && nowMs - createdAtTime <= 24 * 60 * 60 * 1000) ||
        (dateFilter === "last7" && nowMs - createdAtTime <= 7 * 24 * 60 * 60 * 1000);
      const searchOk =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.originalName.toLowerCase().includes(q) ||
        item.mimeType.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));
      return typeOk && folderOk && tagsOk && dateOk && searchOk;
    });
  }, [media, searchQuery, typeFilter, dateFilter, tagFilter, folderFilter, nowMs]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function beginDrag(itemId: string) {
    if (selectedIds.includes(itemId)) {
      setDraggedItemIds(selectedIds);
      return;
    }
    setDraggedItemIds([itemId]);
  }

  function handleDropToFolder(folderId: string | null) {
    if (draggedItemIds.length === 0) return;
    const idsSnapshot = [...draggedItemIds];
    setMedia((prev) =>
      prev.map((item) => (idsSnapshot.includes(item.id) ? { ...item, folderId } : item))
    );
    setDraggedItemIds([]);
    setActiveDropFolder(null);
    setError(null);
    startTransition(async () => {
      const result = await moveMediaToFolder(idsSnapshot, folderId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleCreateFolder() {
    const nameSnapshot = newFolderName.trim();
    if (!nameSnapshot) return;
    setError(null);
    startTransition(async () => {
      const result = await createMediaFolder(nameSnapshot);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFolders((prev) => [...prev, result.folder].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName("");
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);
    formData.set("title", "");
    formData.set("altText", "");
    formData.set("tags", "");
    setError(null);
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { ok?: boolean; error?: string; items?: MediaRow[] };
    if (!response.ok || !data.ok || !data.items) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    setMedia((prev) => [...data.items!, ...prev]);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const items = event.clipboardData?.items ?? [];
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      event.preventDefault();
      void uploadFiles(files);
    }
  }

  function saveInline(item: MediaRow, patch: Partial<Pick<MediaRow, "title" | "altText" | "tags">>) {
    const next: MediaRow = {
      ...item,
      ...patch,
      altText: patch.altText ?? item.altText,
      tags: patch.tags ?? item.tags,
      title: patch.title ?? item.title,
    };
    setMedia((prev) => prev.map((row) => (row.id === item.id ? next : row)));
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("title", next.title);
      formData.set("altText", next.altText ?? "");
      formData.set("tags", next.tags.join(", "));
      const result = await updateMediaAsset(formData);
      if (!result.ok) setError(result.error);
      else setError(null);
    });
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const idsSnapshot = [...selectedIds];
    setMedia((prev) => prev.filter((item) => !idsSnapshot.includes(item.id)));
    setSelectedIds([]);
    setError(null);
    startTransition(async () => {
      const result = await deleteMediaAssets(idsSnapshot);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDeleteOne(id: string) {
    const snapshot = [id];
    setMedia((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setError(null);
    startTransition(async () => {
      const result = await deleteMediaAssets(snapshot);
      if (!result.ok) setError(result.error);
    });
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));

  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-6"
      onPaste={handlePaste}
      onDragEnter={() => setIsUploadDragging(true)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsUploadDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsUploadDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsUploadDragging(false);
        if (event.dataTransfer.files?.length) void uploadFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Media</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length} shown / {media.length} total assets
          </p>
        </div>
        <button
          type="button"
          className={cn(buttonVariants({ size: "lg" }), "px-3")}
          onClick={() => uploadInputRef.current?.click()}
          title="Upload media"
          aria-label="Upload media"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
        onChange={(event) => {
          if (event.target.files?.length) void uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search media..."
            className="h-10 pl-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Type</div>
            {(["all", "image", "video", "document"] as const).map((entry) => (
              <DropdownMenuCheckboxItem
                key={entry}
                checked={typeFilter === entry}
                onCheckedChange={() => setTypeFilter(entry)}
              >
                {entry[0].toUpperCase() + entry.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Date</div>
            <DropdownMenuCheckboxItem checked={dateFilter === "today"} onCheckedChange={() => setDateFilter("today")}>
              Today
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={dateFilter === "last7"} onCheckedChange={() => setDateFilter("last7")}>
              Last 7 days
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={dateFilter === "all"} onCheckedChange={() => setDateFilter("all")}>
              Any time
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Tags</div>
            {allTags.length === 0 ? (
              <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
            ) : (
              allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={tagFilter.includes(tag)}
                  onCheckedChange={(checked) =>
                    setTagFilter((prev) =>
                      checked ? [...prev, tag] : prev.filter((value) => value !== tag)
                    )
                  }
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setTypeFilter("all");
                setDateFilter("all");
                setTagFilter([]);
              }}
            >
              Clear filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: viewMode === "list" ? "default" : "secondary", size: "lg" }),
              "px-3"
            )}
            onClick={() => setViewMode("list")}
            aria-label="List view"
            title="List view"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: viewMode === "grid" ? "default" : "secondary", size: "lg" }),
              "px-3"
            )}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            title="Grid view"
          >
            <Grid3X3 className="size-4" />
          </button>
        </div>
      </div>

      <Card size="sm" className="py-3">
        <CardContent className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFolderFilter("all")}
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropFolder("all");
            }}
            onDragLeave={() => setActiveDropFolder((prev) => (prev === "all" ? null : prev))}
            onDrop={(event) => {
              event.preventDefault();
              handleDropToFolder(null);
            }}
            className={cn(
              buttonVariants({ size: "sm", variant: folderFilter === "all" ? "default" : "secondary" }),
              activeDropFolder === "all" && "ring-2 ring-primary/40"
            )}
          >
            All media
          </button>
          <button
            type="button"
            onClick={() => setFolderFilter("unfiled")}
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropFolder("unfiled");
            }}
            onDragLeave={() => setActiveDropFolder((prev) => (prev === "unfiled" ? null : prev))}
            onDrop={(event) => {
              event.preventDefault();
              handleDropToFolder(null);
            }}
            className={cn(
              buttonVariants({ size: "sm", variant: folderFilter === "unfiled" ? "default" : "secondary" }),
              activeDropFolder === "unfiled" && "ring-2 ring-primary/40"
            )}
          >
            Unfiled
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setFolderFilter(folder.id)}
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropFolder(folder.id);
              }}
              onDragLeave={() => setActiveDropFolder((prev) => (prev === folder.id ? null : prev))}
              onDrop={(event) => {
                event.preventDefault();
                handleDropToFolder(folder.id);
              }}
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: folderFilter === folder.id ? "default" : "secondary",
                }),
                activeDropFolder === folder.id && "ring-2 ring-primary/40"
              )}
            >
              {folder.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Input
              placeholder="New folder"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              className="h-8 w-40"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateFolder();
                }
              }}
            />
            <button
              type="button"
              className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "gap-1.5")}
              onClick={handleCreateFolder}
            >
              <FolderPlus className="size-4" />
              Add folder
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (allFilteredSelected) clearSelection();
            else setSelectedIds(filtered.map((item) => item.id));
          }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <CheckSquare className="size-4" />
          {allFilteredSelected ? "Clear selection" : "Select all"}
        </button>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={handleBulkDelete}
            className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "gap-1.5")}
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            Delete {selectedIds.length}
          </button>
        ) : null}
      </div>

      {viewMode === "list" ? (
        <Card size="sm">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">SELECT</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">NAME</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">ALT TEXT</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TAGS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TYPE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">SIZE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">DATE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">FOLDER</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    draggable
                    onDragStart={() => beginDrag(item.id)}
                    onDragEnd={() => {
                      setDraggedItemIds([]);
                      setActiveDropFolder(null);
                    }}
                  >
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="space-y-1">
                        <Input
                          value={item.title}
                          onChange={(event) => saveInline(item, { title: event.target.value })}
                          className="h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0"
                        />
                        <p className="text-muted-foreground text-xs">{item.originalName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Input
                        defaultValue={item.altText ?? ""}
                        placeholder="Add alt text"
                        onBlur={(event) => {
                          const value = event.currentTarget.value.trim();
                          if (value !== (item.altText ?? "")) saveInline(item, { altText: value });
                        }}
                        className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Input
                        defaultValue={item.tags.join(", ")}
                        placeholder="tag1, tag2"
                        onBlur={(event) => {
                          const nextTags = event.currentTarget.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean);
                          if (nextTags.join("|") !== item.tags.join("|")) saveInline(item, { tags: nextTags });
                        }}
                        className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {mediaTypeFromMime(item.mimeType)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{bytesLabel(item.sizeBytes)}</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {dateFmt.format(new Date(item.createdAt))}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {folders.find((folder) => folder.id === item.folderId)?.name ?? "Unfiled"}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                        onClick={() => handleDeleteOne(item.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden py-0"
              draggable
              onDragStart={() => beginDrag(item.id)}
              onDragEnd={() => {
                setDraggedItemIds([]);
                setActiveDropFolder(null);
              }}
            >
              <div className="bg-muted relative aspect-video">
                {item.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.altText ?? item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <ImageIcon className="size-7" />
                  </div>
                )}
                <label className="absolute top-2 left-2 inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Select ${item.title}`}
                  />
                </label>
              </div>
              <CardContent className="space-y-2 pt-3">
                <Input
                  value={item.title}
                  onChange={(event) => saveInline(item, { title: event.target.value })}
                  className="h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0"
                />
                <p className="text-muted-foreground text-xs">
                  {mediaTypeFromMime(item.mimeType)} · {bytesLabel(item.sizeBytes)}
                </p>
                <Input
                  defaultValue={item.altText ?? ""}
                  placeholder="Alt text"
                  onBlur={(event) => {
                    const value = event.currentTarget.value.trim();
                    if (value !== (item.altText ?? "")) saveInline(item, { altText: value });
                  }}
                  className="h-7 text-xs"
                />
                <Input
                  defaultValue={item.tags.join(", ")}
                  placeholder="Tags comma-separated"
                  onBlur={(event) => {
                    const nextTags = event.currentTarget.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    if (nextTags.join("|") !== item.tags.join("|")) saveInline(item, { tags: nextTags });
                  }}
                  className="h-7 text-xs"
                />
                <p className="text-muted-foreground text-xs">{dateFmt.format(new Date(item.createdAt))}</p>
                <p className="text-muted-foreground text-xs">
                  Folder: {folders.find((folder) => folder.id === item.folderId)?.name ?? "Unfiled"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isUploadDragging ? (
        <div className="pointer-events-none fixed inset-0 z-[160] grid place-items-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-background rounded-xl border px-6 py-4 text-sm shadow-xl">
            Drop files to upload into Media
          </div>
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {isPending ? <p className="text-muted-foreground text-xs">Applying changes...</p> : null}
    </div>
  );
}
