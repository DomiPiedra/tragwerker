"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ClipboardEvent } from "react";
import {
  CheckSquare,
  ChevronRight,
  Filter,
  Folder,
  FolderPlus,
  Grid3X3,
  ImageIcon,
  List,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  createMediaFolder,
  deleteMediaAssets,
  deleteMediaFolder,
  moveMediaToFolder,
  renameMediaFolder,
  updateMediaAsset,
} from "./actions";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = "list" | "grid";
type DateFilter = "all" | "today" | "last7";
type MediaTypeFilter = "all" | "image" | "video" | "document";
type ContextMenuState =
  | { kind: "media"; mediaId: string; x: number; y: number }
  | { kind: "folder"; folderId: string; x: number; y: number }
  | null;

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

export function MediaBrowserFinderClient({
  initialMedia,
  initialFolders,
}: {
  initialMedia: MediaRow[];
  initialFolders: FolderRow[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [folders, setFolders] = useState(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploadDragging, setIsUploadDragging] = useState(false);
  const [draggedMediaIds, setDraggedMediaIds] = useState<string[]>([]);
  const [activeDropFolder, setActiveDropFolder] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [nowMs] = useState(() => Date.now());
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(media.flatMap((item) => item.tags))).sort((a, b) => a.localeCompare(b)),
    [media]
  );

  const breadcrumbs = useMemo(() => {
    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const trail: FolderRow[] = [];
    let cursor = currentFolderId ? byId.get(currentFolderId) ?? null : null;
    while (cursor) {
      trail.unshift(cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
    }
    return trail;
  }, [folders, currentFolderId]);

  const filtered = useMemo(() => {
    const visibleFolders = folders.filter((folder) => folder.parentId === currentFolderId);
    const visibleMedia = media.filter((item) => item.folderId === currentFolderId);
    const q = searchQuery.trim().toLowerCase();

    const filteredFolders = visibleFolders.filter((folder) => {
      if (q.length === 0) return true;
      return folder.name.toLowerCase().includes(q);
    });

    const filteredMedia = visibleMedia.filter((item) => {
      const itemType = mediaTypeFromMime(item.mimeType);
      const typeOk = typeFilter === "all" || itemType === typeFilter;
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
      return typeOk && tagsOk && dateOk && searchOk;
    });

    return { folders: filteredFolders, media: filteredMedia };
  }, [folders, media, currentFolderId, searchQuery, typeFilter, tagFilter, dateFilter, nowMs]);

  const allFilteredSelected =
    filtered.media.length > 0 && filtered.media.every((item) => selectedIds.includes(item.id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function beginDrag(itemId: string) {
    if (selectedIds.includes(itemId)) {
      setDraggedMediaIds(selectedIds);
      return;
    }
    setDraggedMediaIds([itemId]);
  }

  function handleDropToFolder(folderId: string | null) {
    if (draggedMediaIds.length === 0) return;
    const snapshot = [...draggedMediaIds];
    setMedia((prev) => prev.map((item) => (snapshot.includes(item.id) ? { ...item, folderId } : item)));
    setDraggedMediaIds([]);
    setActiveDropFolder(null);
    setError(null);
    startTransition(async () => {
      const result = await moveMediaToFolder(snapshot, folderId);
      if (!result.ok) setError(result.error);
    });
  }

  function saveInline(item: MediaRow, patch: Partial<Pick<MediaRow, "title" | "altText" | "tags">>) {
    const next: MediaRow = { ...item, ...patch, altText: patch.altText ?? item.altText, tags: patch.tags ?? item.tags };
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
    const snapshot = [...selectedIds];
    setMedia((prev) => prev.filter((item) => !snapshot.includes(item.id)));
    setSelectedIds([]);
    startTransition(async () => {
      const result = await deleteMediaAssets(snapshot);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDeleteOne(id: string) {
    setMedia((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    startTransition(async () => {
      const result = await deleteMediaAssets([id]);
      if (!result.ok) setError(result.error);
    });
  }

  function openMediaContextMenu(event: React.MouseEvent, mediaId: string) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ kind: "media", mediaId, x: event.clientX, y: event.clientY });
  }

  function openFolderContextMenu(event: React.MouseEvent, folderId: string) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ kind: "folder", folderId, x: event.clientX, y: event.clientY });
  }

  function handleRenameMediaFromContext(mediaId: string) {
    const item = media.find((entry) => entry.id === mediaId);
    if (!item) return;
    const nextTitle = window.prompt("Rename media item", item.title)?.trim();
    if (!nextTitle || nextTitle === item.title) return;
    saveInline(item, { title: nextTitle });
  }

  function startInlineFolderRename(folderId: string) {
    const folder = folders.find((entry) => entry.id === folderId);
    if (!folder) return;
    setEditingFolderId(folderId);
    setEditingFolderName(folder.name);
  }

  function submitInlineFolderRename(folderId: string) {
    const folder = folders.find((entry) => entry.id === folderId);
    if (!folder) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    const nextName = editingFolderName.trim();
    if (!nextName || nextName === folder.name) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: nextName } : f)));
    setError(null);
    startTransition(async () => {
      const result = await renameMediaFolder(folderId, nextName);
      if (!result.ok) {
        setError(result.error);
        setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: folder.name } : f)));
        return;
      }
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, ...result.folder } : f)).sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    setEditingFolderId(null);
    setEditingFolderName("");
  }

  function handleDeleteFolderFromContext(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const parentId = folder.parentId;
    const foldersSnapshot = folders.map((f) => ({ ...f }));
    const mediaSnapshot = media.map((m) => ({ ...m }));
    const currentSnapshot = currentFolderId;

    setFolders((prev) =>
      prev
        .filter((f) => f.id !== folderId)
        .map((f) => (f.parentId === folderId ? { ...f, parentId } : f))
    );
    setMedia((prev) => prev.map((item) => (item.folderId === folderId ? { ...item, folderId: parentId } : item)));
    setCurrentFolderId((current) => (current === folderId ? parentId : current));
    setContextMenu(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteMediaFolder(folderId);
      if (!result.ok) {
        setError(result.error);
        setFolders(foldersSnapshot);
        setMedia(mediaSnapshot);
        setCurrentFolderId(currentSnapshot);
      }
    });
  }

  useEffect(() => {
    if (!contextMenu) return;

    function closeMenu() {
      setContextMenu(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    function onPointerDownCapture(event: PointerEvent) {
      const menuEl = contextMenuRef.current;
      if (menuEl && event.target instanceof Node && menuEl.contains(event.target)) return;
      closeMenu();
    }

    const frame = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", onPointerDownCapture, true);
    });

    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  async function handleCreateFolder() {
    const siblingNames = new Set(
      folders
        .filter((folder) => folder.parentId === currentFolderId)
        .map((folder) => folder.name.toLowerCase())
    );
    let nextName = "New folder";
    let suffix = 2;
    while (siblingNames.has(nextName.toLowerCase())) {
      nextName = `New folder ${suffix}`;
      suffix += 1;
    }

    setError(null);
    const result = await createMediaFolder(nextName, currentFolderId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setFolders((prev) =>
      [...prev, result.folder].sort((a, b) => {
        if (a.parentId === b.parentId) return a.name.localeCompare(b.name);
        return (a.parentId ?? "").localeCompare(b.parentId ?? "");
      })
    );

    startInlineFolderRename(result.folder.id);
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);
    formData.set("title", "");
    formData.set("altText", "");
    formData.set("tags", "");
    formData.set("folderId", currentFolderId ?? "");
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { ok?: boolean; error?: string; items?: MediaRow[] };
    if (!response.ok || !data.ok || !data.items) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    setMedia((prev) => [...data.items!, ...prev]);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const files: File[] = [];
    for (const item of Array.from(event.clipboardData?.items ?? [])) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      event.preventDefault();
      void uploadFiles(files);
    }
  }

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
            {filtered.folders.length + filtered.media.length} shown / {folders.length + media.length} total items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "px-3")}
            onClick={() => void handleCreateFolder()}
            aria-label="Create folder"
            title="Create folder"
          >
            <FolderPlus className="size-4" />
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ size: "lg" }), "px-3")}
            onClick={() => uploadInputRef.current?.click()}
            aria-label="Upload media"
            title="Upload media"
          >
            <Plus className="size-4" />
          </button>
        </div>
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
            render={<button type="button" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")} />}
          >
            <Filter className="size-4" />
            Filter
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Type</div>
            {(["all", "image", "video", "document"] as const).map((entry) => (
              <DropdownMenuCheckboxItem key={entry} checked={typeFilter === entry} onCheckedChange={() => setTypeFilter(entry)}>
                {entry[0].toUpperCase() + entry.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Date</div>
            <DropdownMenuCheckboxItem checked={dateFilter === "today"} onCheckedChange={() => setDateFilter("today")}>Today</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={dateFilter === "last7"} onCheckedChange={() => setDateFilter("last7")}>Last 7 days</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={dateFilter === "all"} onCheckedChange={() => setDateFilter("all")}>Any time</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Tags</div>
            {allTags.length === 0 ? <DropdownMenuItem disabled>No tags yet</DropdownMenuItem> : allTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={tagFilter.includes(tag)}
                onCheckedChange={(checked) => setTagFilter((prev) => checked ? [...prev, tag] : prev.filter((x) => x !== tag))}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setTypeFilter("all"); setDateFilter("all"); setTagFilter([]); }}>
              Clear filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-2">
          <button type="button" className={cn(buttonVariants({ variant: viewMode === "list" ? "default" : "secondary", size: "lg" }), "px-3")} onClick={() => setViewMode("list")}><List className="size-4" /></button>
          <button type="button" className={cn(buttonVariants({ variant: viewMode === "grid" ? "default" : "secondary", size: "lg" }), "px-3")} onClick={() => setViewMode("grid")}><Grid3X3 className="size-4" /></button>
        </div>
      </div>

      <div
        className={cn("flex items-center gap-1 text-sm", activeDropFolder === "root" && "rounded-md ring-2 ring-primary/40")}
        onDragOver={(event) => { event.preventDefault(); setActiveDropFolder("root"); }}
        onDragLeave={() => setActiveDropFolder((prev) => (prev === "root" ? null : prev))}
        onDrop={(event) => { event.preventDefault(); handleDropToFolder(null); }}
      >
        <button type="button" className={cn("rounded-md px-2 py-1", currentFolderId === null ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted")} onClick={() => setCurrentFolderId(null)}>Media</button>
        {breadcrumbs.map((folder) => (
          <div key={folder.id} className="flex items-center gap-1">
            <ChevronRight className="text-muted-foreground size-3.5" />
            <button type="button" className={cn("rounded-md px-2 py-1", currentFolderId === folder.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted")} onClick={() => setCurrentFolderId(folder.id)}>{folder.name}</button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (allFilteredSelected ? setSelectedIds([]) : setSelectedIds(filtered.media.map((item) => item.id)))}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <CheckSquare className="size-4" />
          {allFilteredSelected ? "Clear selection" : "Select all"}
        </button>
        {selectedIds.length > 0 ? (
          <button type="button" onClick={handleBulkDelete} className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "gap-1.5")} disabled={isPending}>
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
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">ALT/TAGS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TYPE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">SIZE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.folders.map((folder) => (
                  <TableRow
                    key={folder.id}
                    className={cn(activeDropFolder === folder.id && "bg-muted/60")}
                    onDragOver={(event) => { event.preventDefault(); setActiveDropFolder(folder.id); }}
                    onDragLeave={() => setActiveDropFolder((prev) => (prev === folder.id ? null : prev))}
                    onDrop={(event) => { event.preventDefault(); handleDropToFolder(folder.id); }}
                    onContextMenu={(event) => openFolderContextMenu(event, folder.id)}
                  >
                    <TableCell className="px-5 py-3" />
                    <TableCell className="px-5 py-3">
                      <button type="button" className="hover:bg-muted inline-flex items-center gap-2 rounded-md px-1 py-1 text-left" onClick={() => setCurrentFolderId(folder.id)}>
                        <Folder className="size-4 text-amber-500" />
                        {editingFolderId === folder.id ? (
                          <Input
                            autoFocus
                            value={editingFolderName}
                            onChange={(event) => setEditingFolderName(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.stopPropagation();
                                submitInlineFolderRename(folder.id);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditingFolderId(null);
                                setEditingFolderName("");
                              }
                            }}
                            onBlur={() => submitInlineFolderRename(folder.id)}
                            className="h-7 w-44 text-sm"
                          />
                        ) : (
                          <span className="font-medium">{folder.name}</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">Folder</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">-</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{dateFmt.format(new Date(folder.createdAt))}</TableCell>
                    <TableCell className="px-5 py-3" />
                  </TableRow>
                ))}
                {filtered.media.map((item) => (
                  <TableRow
                    key={item.id}
                    draggable
                    onDragStart={() => beginDrag(item.id)}
                    onDragEnd={() => { setDraggedMediaIds([]); setActiveDropFolder(null); }}
                    onContextMenu={(event) => openMediaContextMenu(event, item.id)}
                  >
                    <TableCell className="px-5 py-3">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="space-y-1">
                        <Input value={item.title} onChange={(event) => saveInline(item, { title: event.target.value })} className="h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0" />
                        <p className="text-muted-foreground text-xs">{item.originalName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="space-y-1">
                        <Input defaultValue={item.altText ?? ""} placeholder="Add alt text" onBlur={(event) => {
                          const value = event.currentTarget.value.trim();
                          if (value !== (item.altText ?? "")) saveInline(item, { altText: value });
                        }} className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0" />
                        <Input defaultValue={item.tags.join(", ")} placeholder="tag1, tag2" onBlur={(event) => {
                          const nextTags = event.currentTarget.value.split(",").map((tag) => tag.trim()).filter(Boolean);
                          if (nextTags.join("|") !== item.tags.join("|")) saveInline(item, { tags: nextTags });
                        }} className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0" />
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{mediaTypeFromMime(item.mimeType)}</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{bytesLabel(item.sizeBytes)}</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{dateFmt.format(new Date(item.createdAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.folders.map((folder) => (
            <Card
              key={folder.id}
              className={cn("overflow-hidden py-0", activeDropFolder === folder.id && "ring-2 ring-primary/40")}
              onDragOver={(event) => { event.preventDefault(); setActiveDropFolder(folder.id); }}
              onDragLeave={() => setActiveDropFolder((prev) => (prev === folder.id ? null : prev))}
              onDrop={(event) => { event.preventDefault(); handleDropToFolder(folder.id); }}
              onContextMenu={(event) => openFolderContextMenu(event, folder.id)}
            >
              <button type="button" className="hover:bg-muted/30 flex h-full w-full flex-col items-start gap-2 p-4 text-left" onClick={() => setCurrentFolderId(folder.id)}>
                <Folder className="size-8 text-amber-500" />
                {editingFolderId === folder.id ? (
                  <Input
                    autoFocus
                    value={editingFolderName}
                    onChange={(event) => setEditingFolderName(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.stopPropagation();
                        submitInlineFolderRename(folder.id);
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        setEditingFolderId(null);
                        setEditingFolderName("");
                      }
                    }}
                    onBlur={() => submitInlineFolderRename(folder.id)}
                    className="h-7 w-full text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium">{folder.name}</p>
                )}
                <p className="text-muted-foreground text-xs">Folder</p>
              </button>
            </Card>
          ))}
          {filtered.media.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden py-0"
              draggable
              onDragStart={() => beginDrag(item.id)}
              onDragEnd={() => { setDraggedMediaIds([]); setActiveDropFolder(null); }}
              onContextMenu={(event) => openMediaContextMenu(event, item.id)}
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
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                </label>
              </div>
              <CardContent className="space-y-2 pt-3">
                <Input value={item.title} onChange={(event) => saveInline(item, { title: event.target.value })} className="h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0" />
                <p className="text-muted-foreground text-xs">{mediaTypeFromMime(item.mimeType)} · {bytesLabel(item.sizeBytes)}</p>
                <Input defaultValue={item.altText ?? ""} placeholder="Alt text" onBlur={(event) => {
                  const value = event.currentTarget.value.trim();
                  if (value !== (item.altText ?? "")) saveInline(item, { altText: value });
                }} className="h-7 text-xs" />
                <Input defaultValue={item.tags.join(", ")} placeholder="Tags comma-separated" onBlur={(event) => {
                  const nextTags = event.currentTarget.value.split(",").map((tag) => tag.trim()).filter(Boolean);
                  if (nextTags.join("|") !== item.tags.join("|")) saveInline(item, { tags: nextTags });
                }} className="h-7 text-xs" />
                <p className="text-muted-foreground text-xs">{dateFmt.format(new Date(item.createdAt))}</p>
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

      {contextMenu ? (
        <div
          ref={contextMenuRef}
          role="menu"
          className="bg-popover text-popover-foreground fixed z-[180] min-w-36 rounded-md border p-1 shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {contextMenu.kind === "media" ? (
            <>
              <button
                type="button"
                className="hover:bg-muted w-full rounded-sm px-2 py-1 text-left text-sm"
                onClick={() => {
                  handleRenameMediaFromContext(contextMenu.mediaId);
                  setContextMenu(null);
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="hover:bg-muted text-destructive w-full rounded-sm px-2 py-1 text-left text-sm"
                onClick={() => {
                  handleDeleteOne(contextMenu.mediaId);
                  setContextMenu(null);
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="hover:bg-muted w-full rounded-sm px-2 py-1 text-left text-sm"
                onClick={() => {
                  startInlineFolderRename(contextMenu.folderId);
                  setContextMenu(null);
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="hover:bg-muted text-destructive w-full rounded-sm px-2 py-1 text-left text-sm"
                onClick={() => {
                  handleDeleteFolderFromContext(contextMenu.folderId);
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {isPending ? <p className="text-muted-foreground text-xs">Applying changes...</p> : null}
    </div>
  );
}
