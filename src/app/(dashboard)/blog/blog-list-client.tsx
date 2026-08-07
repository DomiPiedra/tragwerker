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
  Loader2,
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
import { Separator } from "@/components/ui/separator";
import { ContentPreviewResizeHandle } from "@/components/content-preview-resize-handle";
import {
  contentPreviewPanelClassName,
  useContentRowClickHandlers,
  usePreviewPanelResize,
} from "@/lib/content-preview-panel";
import { useTrackContentOpen } from "@/hooks/use-track-content-open";
import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor/editor";
import { MediaGalleryPicker } from "@/components/media/media-gallery-picker";
import { MediaImagePicker } from "@/components/media/media-image-picker";

import { fetchContentSeoRecord, saveContentSeoAction } from "@/app/actions/content-seo";
import { generateBlogPostContent } from "@/app/actions/generateBlogPostContent";
import { popBlogContentGeneration } from "@/lib/blog/command-bar-generation";

import { ContentCreateButton } from "@/components/content-create-button";
import {
  ContentSiteSettingsFields,
  ContentSiteSettingsInlineRow,
} from "@/components/content-site-settings-fields";
import { useContentCreateListener } from "@/hooks/use-content-create-listener";
import { CONTENT_CREATE_EVENTS } from "@/lib/content-create";

import { createBlogPostQuick, deleteBlogPost, updateBlogPost } from "./actions";

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type BlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImageUrl: string;
  galleryUrls: string[];
  published: boolean;
  publishedAt: string;
};

const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });

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

export function BlogListClient({
  initialPosts,
  initialFullViewPostId,
  initialIsFullBlogView,
  initialGenerateContent = false,
}: {
  initialPosts: BlogRow[];
  initialFullViewPostId: string | null;
  initialIsFullBlogView: boolean;
  initialGenerateContent?: boolean;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<boolean[]>([]);
  const [isPending, startTransition] = useTransition();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isResizing, startPanelResize, panelStyle } = usePreviewPanelResize();
  const [showSavedHint, setShowSavedHint] = useState(false);
  const savedHintTimerRef = useRef<number | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const generationStartedRef = useRef(false);
  const [coverImage, setCoverImage] = useState("");
  const [coverImageSaving, setCoverImageSaving] = useState(false);
  const coverSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fullViewPostId = initialFullViewPostId;
  const isFullBlogView = initialIsFullBlogView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen(
    "blogPost",
    selectedId ?? (isFullBlogView ? fullViewPostId : null)
  );

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.trim().toLowerCase();
      const statusOk = publishedFilter.length === 0 || publishedFilter.includes(post.published);
      const searchOk =
        q.length === 0 ||
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        (post.excerpt ?? "").toLowerCase().includes(q) ||
        (post.content ?? "").toLowerCase().includes(q) ||
        (post.published ? "published" : "draft").includes(q);
      return statusOk && searchOk;
    });
  }, [posts, searchQuery, publishedFilter]);

  const selected = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      title: selected.title,
      slug: selected.slug,
      excerpt: selected.excerpt ?? "",
      content: selected.content ?? "",
      heroImageUrl: selected.heroImageUrl ?? "",
      galleryUrls: selected.galleryUrls ?? [],
      published: selected.published,
      publishedAt: toLocalInputValue(selected.publishedAt),
    });
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setCoverImage("");
      return;
    }

    let cancelled = false;
    void fetchContentSeoRecord({
      entityType: "blogPost",
      entityId: selected.id,
    }).then((result) => {
      if (cancelled) return;
      setCoverImage(result.ok && result.seo ? result.seo.seoImage : "");
    });

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  useEffect(() => {
    return () => {
      if (coverSaveTimerRef.current) clearTimeout(coverSaveTimerRef.current);
    };
  }, []);

  function updateCoverImage(seoImage: string) {
    if (!selected) return;
    const entityId = selected.id;
    setCoverImage(seoImage);
    if (coverSaveTimerRef.current) clearTimeout(coverSaveTimerRef.current);
    coverSaveTimerRef.current = setTimeout(async () => {
      setCoverImageSaving(true);
      try {
        const result = await saveContentSeoAction({
          entityType: "blogPost",
          entityId,
          seo: { seoImage },
        });
        if (!result.ok) {
          setError(result.error);
        } else {
          triggerSavedHint();
        }
      } finally {
        setCoverImageSaving(false);
      }
    }, 600);
  }

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
    if (!fullViewPostId) return;
    const idx = posts.findIndex((post) => post.id === fullViewPostId);
    if (idx >= 0) {
      setSelectedId(fullViewPostId);
      setActiveIndex(idx);
    }
  }, [fullViewPostId, posts]);

  useEffect(() => {
    if (!isFullBlogView || !fullViewPostId || !initialGenerateContent) return;
    if (generationStartedRef.current) return;
    const job = popBlogContentGeneration(fullViewPostId);
    if (!job) return;

    generationStartedRef.current = true;
    setIsGeneratingContent(true);
    setError(null);

    void (async () => {
      const result = await generateBlogPostContent({ postId: fullViewPostId, job });
      if (!result.ok) {
        setError(result.error);
        setIsGeneratingContent(false);
        router.replace(`/blog?postId=${encodeURIComponent(fullViewPostId)}&blogView=full`);
        return;
      }

      let postRow: BlogRow | undefined;
      setPosts((prev) => {
        const next = prev.map((post) => {
          if (post.id !== fullViewPostId) return post;
          postRow = {
            ...post,
            content: result.contentHtml,
            excerpt: result.excerpt ?? post.excerpt,
          };
          return postRow;
        });
        return next;
      });

      if (postRow) {
        const nextDraft: BlogDraft = {
          title: postRow.title,
          slug: postRow.slug,
          excerpt: postRow.excerpt ?? "",
          content: result.contentHtml,
          heroImageUrl: postRow.heroImageUrl ?? "",
          galleryUrls: postRow.galleryUrls ?? [],
          published: postRow.published,
          publishedAt: toLocalInputValue(postRow.publishedAt),
        };
        setDraft(nextDraft);
        startTransition(async () => {
          const ok = await persistDraft(postRow!, nextDraft);
          if (ok) triggerSavedHint();
        });
      }

      setIsGeneratingContent(false);
      router.replace(`/blog?postId=${encodeURIComponent(fullViewPostId)}&blogView=full`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per command-bar navigation
  }, [fullViewPostId, initialGenerateContent, isFullBlogView]);

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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (isFullBlogView && selectedId) {
          event.preventDefault();
          startTransition(async () => {
            const ok = await persistDraft();
            if (ok) triggerSavedHint();
          });
          return;
        }
      }

      if (isTypingTarget(event.target)) return;
      if (filtered.length === 0) return;

      if (selectedId) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!isFullBlogView) closePanelWithAutosave();
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
          if (!isFullBlogView && selected) {
            openPostFullView(selected);
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
  }, [activeIndex, filtered, selectedId, selected, draft, isFullBlogView]);

  async function persistDraft(
    selectedSnapshot: BlogRow | null = selected,
    draftSnapshot: BlogDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    const unchanged =
      draftSnapshot.title.trim() === selectedSnapshot.title &&
      draftSnapshot.slug.trim() === selectedSnapshot.slug &&
      draftSnapshot.excerpt.trim() === (selectedSnapshot.excerpt ?? "") &&
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
    formData.set("excerpt", draftSnapshot.excerpt);
    formData.set("content", draftSnapshot.content);
    formData.set("heroImageUrl", draftSnapshot.heroImageUrl);
    formData.set("galleryUrls", JSON.stringify(draftSnapshot.galleryUrls));
    formData.set("published", draftSnapshot.published ? "true" : "false");
    formData.set("publishedAt", draftSnapshot.publishedAt);

    const result = await updateBlogPost(formData);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setPosts((prev) => prev.map((p) => (p.id === result.post.id ? result.post : p)));
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
    const currentIdx = filtered.findIndex((post) => post.id === selectedId);
    if (currentIdx < 0) return;

    const nextIdx = (currentIdx + delta + filtered.length) % filtered.length;
    const nextPost = filtered[nextIdx];

    const selectedSnapshot = selected;
    const draftSnapshot = draft;

    setActiveIndex(nextIdx);
    setSelectedId(nextPost.id);
    setError(null);

    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
    });
  }

  function selectPostPreview(postId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(postId);
    if (isFullBlogView) {
      router.push(`/blog?postId=${encodeURIComponent(postId)}`);
    }
  }

  function openPostFullView(post: BlogRow) {
    router.push(`/blog?postId=${encodeURIComponent(post.id)}&blogView=full`);
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createBlogPostQuick();
      if (!result.ok) return;
      setPosts((prev) => [result.post, ...prev]);
      setError(null);
      openPostFullView(result.post);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.blog, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/blog");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteBlogPost(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/blog");
    });
  }

  const savedHint = (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-zinc-200/70 bg-white/90 px-3 py-1.5 text-xs text-zinc-700 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:text-zinc-200",
        showSavedHint ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      Saved
    </div>
  );

  function renderBlogSiteSettings(): ReactNode {
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

        <ContentFullViewPanelSection title="Page">
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
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Cover image">
            <MediaImagePicker
              value={coverImage}
              variant="cover"
              placeholder="Choose cover image"
              onChange={updateCoverImage}
            />
            {coverImageSaving ? (
              <p className="text-muted-foreground text-xs">Saving cover image…</p>
            ) : null}
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Hero image">
            <MediaImagePicker
              value={draft.heroImageUrl}
              variant="cover"
              placeholder="Choose hero image"
              onChange={updateHeroImage}
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Gallery">
            <MediaGalleryPicker
              value={draft.galleryUrls}
              onChange={(galleryUrls) =>
                setDraft((prev) => (prev ? { ...prev, galleryUrls } : prev))
              }
            />
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Excerpt">
            <textarea
              value={draft.excerpt}
              rows={4}
              className="border-input bg-[#f7f7f7] min-h-[5rem] w-full rounded-lg border border-black/8 px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, excerpt: e.target.value } : prev))}
            />
          </ContentFullViewPanelField>
        </ContentFullViewPanelSection>
      </div>
    );
  }

  function updateHeroImage(heroImageUrl: string) {
    setDraft((prev) => (prev ? { ...prev, heroImageUrl } : prev));
  }

  function renderBlogPageFields(): ReactNode {
    if (!selected) return null;

    const fieldBlock = "grid grid-cols-[140px_1fr] items-center gap-4 rounded-md px-2 py-1.5";
    const excerptBlock = "grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5";

    return (
      <>
        <div className={fieldBlock}>
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-3.5" />
            Updated
          </label>
          <p className="text-sm">{dateFmt.format(new Date(selected.updatedAt))}</p>
        </div>

        <div className={fieldBlock}>
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link2 className="size-3.5" />
            Slug
          </label>
          <Input
            value={draft?.slug ?? ""}
            required
            className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
          />
        </div>

        <ContentSiteSettingsInlineRow
          published={draft?.published ?? false}
          onPublishedChange={(published) =>
            setDraft((prev) => (prev ? { ...prev, published } : prev))
          }
        />

        <div className={excerptBlock}>
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <ImageIcon className="size-3.5" />
            Cover image
          </label>
          <div className="space-y-1">
            <MediaImagePicker
              value={coverImage}
              variant="cover"
              placeholder="Choose cover image"
              onChange={updateCoverImage}
            />
            {coverImageSaving ? (
              <p className="text-muted-foreground text-xs">Saving cover image…</p>
            ) : null}
          </div>
        </div>

        <div className={excerptBlock}>
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <CircleDot className="size-3.5" />
            Excerpt
          </label>
          <textarea
            value={draft?.excerpt ?? ""}
            rows={3}
            className="border-input bg-background w-full rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, excerpt: e.target.value } : prev))}
          />
        </div>
      </>
    );
  }

  function renderBlogEditorFields(mode: "preview" | "full" = "preview"): ReactNode {
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
            placeholder="Title"
            className={contentFullViewTitleClassName}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))
            }
          />

          <div className="relative min-h-[50vh] [&_.prose-premium]:leading-6 [&_.prose-premium_p]:my-0">
            {isGeneratingContent ? (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/75 backdrop-blur-[2px]"
                aria-live="polite"
                aria-busy="true"
              >
                <Loader2 className="text-muted-foreground size-10 animate-spin" />
                <p className="text-muted-foreground text-sm">Generating content…</p>
              </div>
            ) : null}
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
        {renderBlogPageFields()}

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

        <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-md px-2 py-1.5">
          <label className="text-muted-foreground flex items-center gap-2 pt-1 text-sm">
            <CircleDot className="size-3.5" />
            Content
          </label>
          <Editor
            value={draft?.content ?? ""}
            onChange={(nextContent) =>
              setDraft((prev) => (prev ? { ...prev, content: nextContent } : prev))
            }
            handleAIEdit={handleAIEdit}
          />
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? (
          <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p>
        ) : null}
      </div>
    );
  }

  function handleAIEdit(content: string) {
    setError(content);
    window.setTimeout(() => setError((prev) => (prev === content ? null : prev)), 3200);
  }

  function triggerSavedHint() {
    setShowSavedHint(true);
    if (savedHintTimerRef.current) {
      window.clearTimeout(savedHintTimerRef.current);
    }
    savedHintTimerRef.current = window.setTimeout(() => {
      setShowSavedHint(false);
      savedHintTimerRef.current = null;
    }, 1300);
  }

  useEffect(() => {
    return () => {
      if (savedHintTimerRef.current) {
        window.clearTimeout(savedHintTimerRef.current);
      }
    };
  }, []);

  if (isFullBlogView && selected) {
    return (
      <>
        <ContentFullViewShell
          title={draft?.title ?? selected.title}
          onBack={exitFullView}
          onRename={focusContentFullViewRename}
          onDelete={handleFullViewDelete}
          settingsContent={renderBlogSiteSettings()}
          seoContext={{
            entityType: "blogPost",
            entityId: selected.id,
            title: draft?.title ?? selected.title,
            content: [draft?.excerpt ?? "", draft?.content ?? ""].filter(Boolean).join("\n\n"),
          }}
        >
          <div className="mx-auto w-full max-w-4xl">
            {renderBlogEditorFields("full")}
          </div>
        </ContentFullViewShell>
        {savedHint}
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          selected && !isFullBlogView ? "mr-0" : ""
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", isFullBlogView && "hidden")}>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Blog</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {posts.length} total posts
            </p>
          </div>
          <ContentCreateButton
            label="New Blog"
            isPending={isPending}
            onClick={handleQuickCreate}
          />
        </div>

        <div className={cn("mt-5 flex flex-col gap-3 sm:flex-row", isFullBlogView && "hidden")}>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search posts..."
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
              <DropdownMenuCheckboxItem
                checked={publishedFilter.includes(true)}
                onCheckedChange={(checked) =>
                  setPublishedFilter((prev) =>
                    checked ? [...prev, true] : prev.filter((v) => v !== true)
                  )
                }
              >
                Published
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={publishedFilter.includes(false)}
                onCheckedChange={(checked) =>
                  setPublishedFilter((prev) =>
                    checked ? [...prev, false] : prev.filter((v) => v !== false)
                  )
                }
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPublishedFilter([])}>Clear filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card size="sm" className={cn("mt-4", isFullBlogView && "hidden")}>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">TITLE</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">STATUS</TableHead>
                  <TableHead className="px-5 text-xs tracking-wide text-muted-foreground">PUBLISHED</TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((post, idx) => (
                  <TableRow
                    key={post.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={cn(
                      "cursor-pointer",
                      activeIndex === idx && "bg-muted/60",
                      selectedId === post.id && "bg-muted"
                    )}
                    onClick={() =>
                      schedulePreview(() => selectPostPreview(post.id, idx))
                    }
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      openFull(() => openPostFullView(post));
                    }}
                  >
                    <TableCell className="px-5 py-3 font-medium">{post.title}</TableCell>
                    <TableCell className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-4 py-1 text-sm",
                          post.published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                        )}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {post.publishedAt ? dateFmt.format(new Date(post.publishedAt)) : "-"}
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
                              setSelectedId(post.id);
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
                                const result = await deleteBlogPost(post.id);
                                if (!result.ok) {
                                  setError(result.error);
                                  return;
                                }
                                setPosts((prev) => prev.filter((p) => p.id !== post.id));
                                if (selectedId === post.id) setSelectedId(null);
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

      {selected && !isFullBlogView ? (
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
        {selected && !isFullBlogView ? (
          <ContentPreviewResizeHandle onMouseDown={startPanelResize} />
        ) : null}
        {selected ? (
          <>
            <div className="mb-7 flex items-center justify-between">
              <Input
                value={draft?.title ?? ""}
                required
                placeholder="Title"
                className="font-heading h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              />
              <div className="flex items-center gap-1">
                {!isFullBlogView ? (
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                    onClick={() => openPostFullView(selected)}
                    title="Open full view"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                ) : null}
                {!isFullBlogView ? (
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

            {renderBlogEditorFields()}
          </>
        ) : null}
      </aside>
      {savedHint}
    </div>
  );
}

