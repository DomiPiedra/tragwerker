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
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  User,
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
import {
  ContentSiteSettingsFields,
  ContentSiteSettingsInlineRow,
} from "@/components/content-site-settings-fields";
import { MediaImagePicker } from "@/components/media/media-image-picker";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createTeamMemberQuick, deleteTeamMember, updateTeamMember } from "./actions";

type TeamRow = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type TeamDraft = {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  published: boolean;
  publishedAt: string;
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function splitLocalDateTime(value: string) {
  if (!value) return { date: "", time: "" };
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function mergeLocalDateTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });

export function TeamListClient({
  initialMembers,
  initialFullViewMemberId,
  initialIsFullTeamView,
}: {
  initialMembers: TeamRow[];
  initialFullViewMemberId: string | null;
  initialIsFullTeamView: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();

  const fullViewMemberId = initialFullViewMemberId;
  const isFullTeamView = initialIsFullTeamView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "teamMember",
    selectedId ?? (isFullTeamView ? fullViewMemberId : null)
  );

  const allRoles = useMemo(
    () => Array.from(new Set(members.map((m) => m.role || "Editor"))).sort(),
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((member) => {
      const role = member.role || "Editor";
      const q = searchQuery.trim().toLowerCase();
      const roleOk = roleFilter.length === 0 || roleFilter.includes(role);
      const searchOk =
        q.length === 0 ||
        member.name.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q) ||
        (member.bio ?? "").toLowerCase().includes(q);
      return roleOk && searchOk;
    });
  }, [members, searchQuery, roleFilter]);

  const selected = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      name: selected.name,
      role: selected.role || "Editor",
      bio: selected.bio ?? "",
      avatarUrl: selected.avatarUrl ?? "",
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
    if (!fullViewMemberId) return;
    const idx = members.findIndex((member) => member.id === fullViewMemberId);
    if (idx >= 0) {
      setSelectedId(fullViewMemberId);
      setActiveIndex(idx);
    }
  }, [fullViewMemberId, members]);

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
          if (!isFullTeamView) closePanelWithAutosave();
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
          if (!isFullTeamView && selected) {
            openMemberFullView(selected);
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
  }, [activeIndex, filtered, selectedId, selected, draft, isFullTeamView]);

  async function persistDraft(
    selectedSnapshot: TeamRow | null = selected,
    draftSnapshot: TeamDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    const unchanged =
      draftSnapshot.name.trim() === selectedSnapshot.name &&
      draftSnapshot.role.trim() === (selectedSnapshot.role ?? "Editor") &&
      draftSnapshot.bio.trim() === (selectedSnapshot.bio ?? "") &&
      draftSnapshot.avatarUrl.trim() === (selectedSnapshot.avatarUrl ?? "") &&
      draftSnapshot.published === selectedSnapshot.published &&
      draftSnapshot.publishedAt.trim() === toLocalInputValue(selectedSnapshot.publishedAt);
    if (unchanged) return true;

    const formData = new FormData();
    formData.set("id", selectedSnapshot.id);
    formData.set("name", draftSnapshot.name);
    formData.set("role", draftSnapshot.role);
    formData.set("bio", draftSnapshot.bio);
    formData.set("avatarUrl", draftSnapshot.avatarUrl);
    formData.set("published", draftSnapshot.published ? "true" : "false");
    formData.set("publishedAt", draftSnapshot.publishedAt);

    const result = await updateTeamMember(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setMembers((prev) =>
      prev.map((member) => (member.id === result.member.id ? result.member : member))
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

    const currentIdx = filtered.findIndex((member) => member.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx = (currentIdx + delta + filtered.length) % filtered.length;
    const nextMember = filtered[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextMember.id);
    setError(null);

    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectMemberPreview(memberId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(memberId);
    if (isFullTeamView) {
      router.push(`/team?memberId=${encodeURIComponent(memberId)}`);
    }
  }

  function openMemberFullView(member: TeamRow) {
    router.push(`/team?memberId=${encodeURIComponent(member.id)}&teamView=full`);
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createTeamMemberQuick();
      if (!result.ok) return;
      setMembers((prev) => [result.member, ...prev]);
      setError(null);
      openMemberFullView(result.member);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.team, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/team");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteTeamMember(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/team");
    });
  }

  function renderTeamSiteSettings(): ReactNode {
    if (!selected || !draft) return null;
    return (
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
    );
  }

  function renderTeamEditorFields(): ReactNode {
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
            <User className="size-3.5" />
            Name
          </label>
          <Input
            id={CONTENT_FULL_VIEW_RENAME_ID}
            value={draft?.name ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CircleDot className="size-3.5" />
            Role
          </label>
          <Input
            value={draft?.role ?? ""}
            className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, role: e.target.value } : prev))}
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <User className="size-3.5" />
            Avatar
          </label>
          <MediaImagePicker
            value={draft?.avatarUrl ?? ""}
            fallbackLabel={(draft?.name ?? selected.name).slice(0, 1).toUpperCase() || "?"}
            onChange={(avatarUrl) =>
              setDraft((prev) => (prev ? { ...prev, avatarUrl } : prev))
            }
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
            Bio
          </label>
          <textarea
            value={draft?.bio ?? ""}
            rows={5}
            className="border-input bg-background min-h-[7rem] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, bio: e.target.value } : prev))}
          />
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? (
          <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p>
        ) : null}
      </div>
    );
  }

  if (isFullTeamView && selected) {
    return (
      <ContentFullViewShell
        title={draft?.name ?? selected.name}
        onBack={exitFullView}
        onRename={focusContentFullViewRename}
        onDelete={handleFullViewDelete}
        settingsContent={renderTeamSiteSettings()}
        seoContext={{
          entityType: "teamMember",
          entityId: selected.id,
          title: draft?.name ?? selected.name,
          content: [draft?.role ?? "", draft?.bio ?? ""].filter(Boolean).join("\n\n"),
        }}
      >
        <div className="mx-auto w-full max-w-4xl">
          {renderTeamEditorFields()}
        </div>
      </ContentFullViewShell>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullTeamView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullTeamView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Team</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {members.length} team members
            </p>
          </div>
          <ContentCreateButton
            label="New Team Member"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullTeamView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search team..."
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
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Role</div>
              {allRoles.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={roleFilter.includes(role)}
                  onCheckedChange={(checked) =>
                    setRoleFilter((prev) =>
                      checked ? [...prev, role] : prev.filter((r) => r !== role)
                    )
                  }
                >
                  {role}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleFilter([])}>Clear filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullTeamView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">NAME</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">ROLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">BIO</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">DATE</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member, idx) => (
                  <TableRow
                    key={member.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={cn(
                      "cursor-pointer",
                      activeIndex === idx && "bg-muted/60",
                      selectedId === member.id && "bg-muted"
                    )}
                    onClick={() =>
                      schedulePreview(() => selectMemberPreview(member.id, idx))
                    }
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      openFull(() => openMemberFullView(member));
                    }}
                  >
                    <TableCell className="px-5 py-3 font-medium">{member.name}</TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">{member.role}</TableCell>
                    <TableCell className="max-w-[320px] truncate px-5 py-3 text-muted-foreground">
                      {member.bio ?? "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {dateFmt.format(new Date(member.updatedAt))}
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
                              setSelectedId(member.id);
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
                                const result = await deleteTeamMember(member.id);
                                if (!result.ok) {
                                  setError(result.error);
                                  return;
                                }
                                setMembers((prev) => prev.filter((m) => m.id !== member.id));
                                if (selectedId === member.id) setSelectedId(null);
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

      {selected && !isFullTeamView ? (
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
        {selected && !isFullTeamView ? (
          <ContentPreviewResizeHandle onMouseDown={startPanelResize} />
        ) : null}
        {selected ? (
          <>
            <div className="mb-7 flex items-center justify-between">
              <h2 className="font-heading text-4xl font-semibold tracking-tight">
                {selected.name || "Name"}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  onClick={() => openMemberFullView(selected)}
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

            {renderTeamEditorFields()}
          </>
        ) : null}
      </aside>
    </div>
  );
}

