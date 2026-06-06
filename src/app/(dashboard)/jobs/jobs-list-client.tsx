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
  Briefcase,
  Building2,
  CalendarDays,
  CircleDot,
  ExternalLink,
  Filter,
  ImageIcon,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Search,
  Sparkles,
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
import { MediaImagePicker } from "@/components/media/media-image-picker";
import { fetchContentSeoRecord, saveContentSeoAction } from "@/app/actions/content-seo";
import { generateJobContent } from "@/app/actions/generateJobContent";
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
import type { EmploymentType, RemoteType } from "@/generated/prisma/client";
import {
  EMPLOYMENT_TYPE_LABELS,
  REMOTE_TYPE_LABELS,
  type SerializedJob,
} from "@/lib/jobs/serialize";

import {
  createJobQuick,
  deleteJob,
  deleteJobsBulk,
  publishJobsBulk,
  updateJob,
} from "./actions";

type JobDraft = {
  title: string;
  slug: string;
  position: string;
  department: string;
  location: string;
  employmentType: string;
  remoteType: string;
  salary: string;
  applicationEmail: string;
  applicationUrl: string;
  shortDescription: string;
  content: string;
  requirements: string;
  benefits: string;
  responsibilities: string;
  featured: boolean;
  published: boolean;
  publishedAt: string;
};

type SortKey = "title" | "department" | "location" | "employmentType" | "updatedAt" | "published";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;
const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });

const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];
const REMOTE_TYPES = Object.keys(REMOTE_TYPE_LABELS) as RemoteType[];

function jobToDraft(job: SerializedJob): JobDraft {
  return {
    title: job.title,
    slug: job.slug,
    position: job.position ?? "",
    department: job.department ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType ?? "",
    remoteType: job.remoteType ?? "",
    salary: job.salary ?? "",
    applicationEmail: job.applicationEmail ?? "",
    applicationUrl: job.applicationUrl ?? "",
    shortDescription: job.shortDescription ?? "",
    content: job.content ?? "",
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
    responsibilities: job.responsibilities ?? "",
    featured: job.featured,
    published: job.published,
    publishedAt: toLocalInputValue(job.publishedAt),
  };
}

function draftUnchanged(job: SerializedJob, draft: JobDraft): boolean {
  return (
    draft.title.trim() === job.title &&
    draft.slug.trim() === job.slug &&
    draft.position.trim() === (job.position ?? "") &&
    draft.department.trim() === (job.department ?? "") &&
    draft.location.trim() === (job.location ?? "") &&
    draft.employmentType === (job.employmentType ?? "") &&
    draft.remoteType === (job.remoteType ?? "") &&
    draft.salary.trim() === (job.salary ?? "") &&
    draft.applicationEmail.trim() === (job.applicationEmail ?? "") &&
    draft.applicationUrl.trim() === (job.applicationUrl ?? "") &&
    draft.shortDescription.trim() === (job.shortDescription ?? "") &&
    draft.content.trim() === (job.content ?? "") &&
    draft.requirements.trim() === (job.requirements ?? "") &&
    draft.benefits.trim() === (job.benefits ?? "") &&
    draft.responsibilities.trim() === (job.responsibilities ?? "") &&
    draft.featured === job.featured &&
    draft.published === job.published &&
    draft.publishedAt.trim() === toLocalInputValue(job.publishedAt)
  );
}

function buildFormData(jobId: string, draft: JobDraft): FormData {
  const formData = new FormData();
  formData.set("id", jobId);
  formData.set("title", draft.title);
  formData.set("slug", draft.slug);
  formData.set("position", draft.position);
  formData.set("department", draft.department);
  formData.set("location", draft.location);
  formData.set("employmentType", draft.employmentType);
  formData.set("remoteType", draft.remoteType);
  formData.set("salary", draft.salary);
  formData.set("applicationEmail", draft.applicationEmail);
  formData.set("applicationUrl", draft.applicationUrl);
  formData.set("shortDescription", draft.shortDescription);
  formData.set("content", draft.content);
  formData.set("requirements", draft.requirements);
  formData.set("benefits", draft.benefits);
  formData.set("responsibilities", draft.responsibilities);
  formData.set("featured", draft.featured ? "true" : "false");
  formData.set("published", draft.published ? "true" : "false");
  formData.set("publishedAt", draft.publishedAt);
  return formData;
}

export function JobsListClient({
  initialJobs,
  initialFullViewJobId,
  initialIsFullJobView,
  initialGenerateContent = false,
}: {
  initialJobs: SerializedJob[];
  initialFullViewJobId: string | null;
  initialIsFullJobView: boolean;
  initialGenerateContent?: boolean;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<boolean[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentType[]>([]);
  const [remoteFilter, setRemoteFilter] = useState<RemoteType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);
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

  const fullViewJobId = initialFullViewJobId;
  const isFullJobView = initialIsFullJobView;
  const { schedulePreview, openFull } = useContentRowClickHandlers();
  useTrackContentOpen("job", selectedId ?? (isFullJobView ? fullViewJobId : null));

  const departments = useMemo(
    () =>
      [...new Set(jobs.map((j) => j.department).filter((d): d is string => Boolean(d?.trim())))].sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = jobs.filter((job) => {
      const statusOk = publishedFilter.length === 0 || publishedFilter.includes(job.published);
      const deptOk =
        departmentFilter.length === 0 ||
        (job.department && departmentFilter.includes(job.department));
      const empOk =
        employmentFilter.length === 0 ||
        (job.employmentType && employmentFilter.includes(job.employmentType));
      const remoteOk =
        remoteFilter.length === 0 || (job.remoteType && remoteFilter.includes(job.remoteType));
      const searchOk =
        q.length === 0 ||
        job.title.toLowerCase().includes(q) ||
        job.slug.toLowerCase().includes(q) ||
        (job.position ?? "").toLowerCase().includes(q) ||
        (job.department ?? "").toLowerCase().includes(q) ||
        (job.location ?? "").toLowerCase().includes(q) ||
        (job.shortDescription ?? "").toLowerCase().includes(q) ||
        (job.published ? "published" : "draft").includes(q);
      return statusOk && deptOk && empOk && remoteOk && searchOk;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "department":
          cmp = (a.department ?? "").localeCompare(b.department ?? "");
          break;
        case "location":
          cmp = (a.location ?? "").localeCompare(b.location ?? "");
          break;
        case "employmentType":
          cmp = (a.employmentType ?? "").localeCompare(b.employmentType ?? "");
          break;
        case "published":
          cmp = Number(a.published) - Number(b.published);
          break;
        case "updatedAt":
        default:
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [
    jobs,
    searchQuery,
    publishedFilter,
    departmentFilter,
    employmentFilter,
    remoteFilter,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const selected = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? null,
    [jobs, selectedId]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, publishedFilter, departmentFilter, employmentFilter, remoteFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(jobToDraft(selected));
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setCoverImage("");
      return;
    }
    let cancelled = false;
    void fetchContentSeoRecord({ entityType: "job", entityId: selected.id }).then((result) => {
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

  useEffect(() => {
    if (paginated.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, paginated.length - 1));
  }, [paginated.length]);

  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  useEffect(() => {
    if (!fullViewJobId) return;
    const idx = jobs.findIndex((job) => job.id === fullViewJobId);
    if (idx >= 0) {
      setSelectedId(fullViewJobId);
    }
  }, [fullViewJobId, jobs]);

  useEffect(() => {
    if (!isFullJobView || !fullViewJobId || !initialGenerateContent) return;
    if (generationStartedRef.current) return;
    generationStartedRef.current = true;
    setIsGeneratingContent(true);
    setError(null);

    void (async () => {
      const result = await generateJobContent({ jobId: fullViewJobId });
      if (!result.ok) {
        setError(result.error);
        setIsGeneratingContent(false);
        router.replace(`/jobs?jobId=${encodeURIComponent(fullViewJobId)}&jobView=full`);
        return;
      }

      setJobs((prev) => prev.map((j) => (j.id === result.job.id ? result.job : j)));
      setDraft(jobToDraft(result.job));
      setIsGeneratingContent(false);
      router.replace(`/jobs?jobId=${encodeURIComponent(fullViewJobId)}&jobView=full`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullViewJobId, initialGenerateContent, isFullJobView]);

  function updateCoverImage(seoImage: string) {
    if (!selected) return;
    const entityId = selected.id;
    setCoverImage(seoImage);
    if (coverSaveTimerRef.current) clearTimeout(coverSaveTimerRef.current);
    coverSaveTimerRef.current = setTimeout(async () => {
      setCoverImageSaving(true);
      try {
        const result = await saveContentSeoAction({
          entityType: "job",
          entityId,
          seo: { seoImage },
        });
        if (!result.ok) setError(result.error);
        else triggerSavedHint();
      } finally {
        setCoverImageSaving(false);
      }
    }, 600);
  }

  function triggerSavedHint() {
    setShowSavedHint(true);
    if (savedHintTimerRef.current) window.clearTimeout(savedHintTimerRef.current);
    savedHintTimerRef.current = window.setTimeout(() => {
      setShowSavedHint(false);
      savedHintTimerRef.current = null;
    }, 1300);
  }

  async function persistDraft(
    selectedSnapshot: SerializedJob | null = selected,
    draftSnapshot: JobDraft | null = draft
  ) {
    if (!selectedSnapshot || !draftSnapshot) return true;
    if (draftUnchanged(selectedSnapshot, draftSnapshot)) return true;

    const result = await updateJob(buildFormData(selectedSnapshot.id, draftSnapshot));
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setJobs((prev) => prev.map((j) => (j.id === result.job.id ? result.job : j)));
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

  function selectJobPreview(jobId: string, idx: number) {
    setActiveIndex(idx);
    setError(null);
    setSelectedId(jobId);
    if (isFullJobView) {
      router.push(`/jobs?jobId=${encodeURIComponent(jobId)}`);
    }
  }

  function openJobFullView(job: SerializedJob) {
    router.push(`/jobs?jobId=${encodeURIComponent(job.id)}&jobView=full`);
  }

  const handleQuickCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createJobQuick();
      if (!result.ok) return;
      setJobs((prev) => [result.job, ...prev]);
      setError(null);
      openJobFullView(result.job);
    });
  }, [router]);

  useContentCreateListener(CONTENT_CREATE_EVENTS.job, handleQuickCreate);

  function exitFullView() {
    const selectedSnapshot = selected;
    const draftSnapshot = draft;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      await persistDraft(selectedSnapshot, draftSnapshot);
      router.push("/jobs");
    });
  }

  function handleFullViewDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteJob(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedId(null);
      router.push("/jobs");
    });
  }

  function handleGenerateContent() {
    if (!selected) return;
    setIsGeneratingContent(true);
    setError(null);
    startTransition(async () => {
      const result = await generateJobContent({ jobId: selected.id });
      if (!result.ok) {
        setError(result.error);
        setIsGeneratingContent(false);
        return;
      }
      setJobs((prev) => prev.map((j) => (j.id === result.job.id ? result.job : j)));
      setDraft(jobToDraft(result.job));
      setIsGeneratingContent(false);
      triggerSavedHint();
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllOnPage() {
    const pageIds = paginated.map((j) => j.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  }

  function handleAIEdit(content: string) {
    setError(content);
    window.setTimeout(() => setError((prev) => (prev === content ? null : prev)), 3200);
  }

  function renderJobSiteSettings(): ReactNode {
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

        <ContentFullViewPanelSection title="Job">
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
          <ContentFullViewPanelField label="Featured">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, featured: e.target.checked } : prev))
                }
              />
              Highlight on careers page
            </label>
          </ContentFullViewPanelField>
          <ContentFullViewPanelField label="Featured image">
            <MediaImagePicker
              value={coverImage}
              variant="cover"
              placeholder="Choose featured image"
              onChange={updateCoverImage}
            />
            {coverImageSaving ? (
              <p className="text-muted-foreground text-xs">Saving featured image…</p>
            ) : null}
          </ContentFullViewPanelField>
        </ContentFullViewPanelSection>
      </div>
    );
  }

  function renderFieldRow(
    label: string,
    icon: ReactNode,
    children: ReactNode,
    alignTop = false
  ): ReactNode {
    return (
      <div
        className={cn(
          "grid grid-cols-[140px_1fr] gap-4 rounded-md px-2 py-1.5",
          alignTop ? "items-start" : "items-center"
        )}
      >
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          {icon}
          {label}
        </label>
        {children}
      </div>
    );
  }

  function renderJobEditorFields(): ReactNode {
    if (!selected || !draft) return null;

    const inputClass = "h-8 border-0 bg-transparent px-0 focus-visible:ring-0";
    const textareaClass =
      "border-input bg-background min-h-[5rem] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

    return (
      <div className="space-y-2">
        {renderFieldRow(
          "Updated",
          <CalendarDays className="size-3.5" />,
          <p className="text-sm">{dateFmt.format(new Date(selected.updatedAt))}</p>
        )}

        {renderFieldRow(
          "Title",
          <CircleDot className="size-3.5" />,
          <Input
            id={CONTENT_FULL_VIEW_RENAME_ID}
            value={draft.title}
            required
            className={inputClass}
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
          />
        )}

        {renderFieldRow(
          "Slug",
          <Link2 className="size-3.5" />,
          <Input
            value={draft.slug}
            required
            className={inputClass}
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
          />
        )}

        {renderFieldRow(
          "Short description",
          <CircleDot className="size-3.5" />,
          <textarea
            value={draft.shortDescription}
            rows={3}
            className={textareaClass}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, shortDescription: e.target.value } : prev))
            }
          />,
          true
        )}

        <ContentSiteSettingsInlineRow
          published={draft.published}
          onPublishedChange={(published) =>
            setDraft((prev) => (prev ? { ...prev, published } : prev))
          }
        />

        <div className="pt-4">
          <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
            Job Details
          </h3>
          {renderFieldRow(
            "Position",
            <Briefcase className="size-3.5" />,
            <Input
              value={draft.position}
              className={inputClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, position: e.target.value } : prev))
              }
            />
          )}
          {renderFieldRow(
            "Department",
            <Building2 className="size-3.5" />,
            <Input
              value={draft.department}
              className={inputClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, department: e.target.value } : prev))
              }
            />
          )}
          {renderFieldRow(
            "Location",
            <MapPin className="size-3.5" />,
            <Input
              value={draft.location}
              className={inputClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, location: e.target.value } : prev))
              }
            />
          )}
          {renderFieldRow(
            "Employment",
            <Briefcase className="size-3.5" />,
            <select
              value={draft.employmentType}
              className="h-8 w-full rounded-md border-0 bg-transparent text-sm outline-none"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, employmentType: e.target.value } : prev))
              }
            >
              <option value="">—</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
          {renderFieldRow(
            "Remote",
            <MapPin className="size-3.5" />,
            <select
              value={draft.remoteType}
              className="h-8 w-full rounded-md border-0 bg-transparent text-sm outline-none"
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, remoteType: e.target.value } : prev))
              }
            >
              <option value="">—</option>
              {REMOTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {REMOTE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
          {renderFieldRow(
            "Salary",
            <CircleDot className="size-3.5" />,
            <Input
              value={draft.salary}
              className={inputClass}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, salary: e.target.value } : prev))}
            />
          )}
          {renderFieldRow(
            "Apply email",
            <Mail className="size-3.5" />,
            <Input
              value={draft.applicationEmail}
              type="email"
              className={inputClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, applicationEmail: e.target.value } : prev))
              }
            />
          )}
          {renderFieldRow(
            "Apply URL",
            <Link2 className="size-3.5" />,
            <Input
              value={draft.applicationUrl}
              className={inputClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, applicationUrl: e.target.value } : prev))
              }
            />
          )}
        </div>

        <div className="pt-4">
          <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
            Content
          </h3>
          {renderFieldRow(
            "Main content",
            <CircleDot className="size-3.5" />,
            <Editor
              value={draft.content}
              onChange={(nextContent) =>
                setDraft((prev) => (prev ? { ...prev, content: nextContent } : prev))
              }
              handleAIEdit={handleAIEdit}
            />,
            true
          )}
        </div>

        <div className="pt-4">
          <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase">
            Additional Sections
          </h3>
          {renderFieldRow(
            "Responsibilities",
            <CircleDot className="size-3.5" />,
            <textarea
              value={draft.responsibilities}
              rows={4}
              className={textareaClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, responsibilities: e.target.value } : prev))
              }
            />,
            true
          )}
          {renderFieldRow(
            "Requirements",
            <CircleDot className="size-3.5" />,
            <textarea
              value={draft.requirements}
              rows={4}
              className={textareaClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, requirements: e.target.value } : prev))
              }
            />,
            true
          )}
          {renderFieldRow(
            "Benefits",
            <CircleDot className="size-3.5" />,
            <textarea
              value={draft.benefits}
              rows={4}
              className={textareaClass}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, benefits: e.target.value } : prev))
              }
            />,
            true
          )}
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        {isPending ? <p className="text-muted-foreground px-2 pt-2 text-xs">Saving changes…</p> : null}
      </div>
    );
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

  if (isFullJobView && selected) {
    return (
      <>
        <ContentFullViewShell
          title={draft?.title ?? selected.title}
          onBack={exitFullView}
          onRename={focusContentFullViewRename}
          onDelete={handleFullViewDelete}
          onAi={handleGenerateContent}
          settingsContent={renderJobSiteSettings()}
          seoContext={{
            entityType: "job",
            entityId: selected.id,
            title: draft?.title ?? selected.title,
            content: [
              draft?.shortDescription ?? "",
              draft?.content ?? "",
              draft?.responsibilities ?? "",
              draft?.requirements ?? "",
              draft?.benefits ?? "",
            ]
              .filter(Boolean)
              .join("\n\n"),
          }}
        >
          <div className="mx-auto w-full max-w-4xl">
            <textarea
              id={CONTENT_FULL_VIEW_RENAME_ID}
              value={draft?.title ?? ""}
              required
              rows={1}
              placeholder="Job Title"
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
                  <p className="text-muted-foreground text-sm">Generating job content…</p>
                </div>
              ) : null}
              <Editor
                value={draft?.content ?? ""}
                onChange={(nextContent) =>
                  setDraft((prev) => (prev ? { ...prev, content: nextContent } : prev))
                }
                handleAIEdit={handleAIEdit}
                className="prose-premium-canvas"
              />
            </div>
            {error ? <p className="text-destructive mt-4 text-xs">{error}</p> : null}
          </div>
        </ContentFullViewShell>
        {savedHint}
      </>
    );
  }

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((job) => selectedIds.includes(job.id));

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} shown / {jobs.length} total jobs
            </p>
          </div>
          <ContentCreateButton label="New Job" isPending={isPending} onClick={handleQuickCreate} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search jobs..."
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
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Department</div>
              {departments.map((dept) => (
                <DropdownMenuCheckboxItem
                  key={dept}
                  checked={departmentFilter.includes(dept)}
                  onCheckedChange={(checked) =>
                    setDepartmentFilter((prev) =>
                      checked ? [...prev, dept] : prev.filter((d) => d !== dept)
                    )
                  }
                >
                  {dept}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">
                Employment Type
              </div>
              {EMPLOYMENT_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={employmentFilter.includes(type)}
                  onCheckedChange={(checked) =>
                    setEmploymentFilter((prev) =>
                      checked ? [...prev, type] : prev.filter((t) => t !== type)
                    )
                  }
                >
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-1.5 py-1 text-xs font-medium">Remote</div>
              {REMOTE_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={remoteFilter.includes(type)}
                  onCheckedChange={(checked) =>
                    setRemoteFilter((prev) =>
                      checked ? [...prev, type] : prev.filter((t) => t !== type)
                    )
                  }
                >
                  {REMOTE_TYPE_LABELS[type]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setPublishedFilter([]);
                  setDepartmentFilter([]);
                  setEmploymentFilter([]);
                  setRemoteFilter([]);
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{selectedIds.length} selected</span>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              onClick={() =>
                startTransition(async () => {
                  const result = await publishJobsBulk(selectedIds, true);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setJobs((prev) =>
                    prev.map((j) => result.jobs.find((row) => row.id === j.id) ?? j)
                  );
                  setSelectedIds([]);
                })
              }
            >
              Publish
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              onClick={() =>
                startTransition(async () => {
                  const result = await publishJobsBulk(selectedIds, false);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setJobs((prev) =>
                    prev.map((j) => result.jobs.find((row) => row.id === j.id) ?? j)
                  );
                  setSelectedIds([]);
                })
              }
            >
              Unpublish
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteJobsBulk(selectedIds);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setJobs((prev) => prev.filter((j) => !selectedIds.includes(j.id)));
                  if (selectedId && selectedIds.includes(selectedId)) setSelectedId(null);
                  setSelectedIds([]);
                })
              }
            >
              Delete
            </button>
          </div>
        ) : null}

        <Card size="sm" className="mt-4">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("title")}>
                      TITLE {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("department")}>
                      DEPARTMENT {sortKey === "department" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("location")}>
                      LOCATION {sortKey === "location" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("employmentType")}>
                      EMPLOYMENT {sortKey === "employmentType" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("published")}>
                      STATUS {sortKey === "published" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5">
                    <button type="button" className="text-xs tracking-wide text-muted-foreground" onClick={() => toggleSort("updatedAt")}>
                      UPDATED {sortKey === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((job, idx) => (
                  <TableRow
                    key={job.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={cn(
                      "cursor-pointer",
                      activeIndex === idx && "bg-muted/60",
                      selectedId === job.id && "bg-muted"
                    )}
                    onClick={() => schedulePreview(() => selectJobPreview(job.id, idx))}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      openFull(() => openJobFullView(job));
                    }}
                  >
                    <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => toggleSelected(job.id)}
                        aria-label={`Select ${job.title}`}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium">
                      {job.title}
                      {job.featured ? (
                        <Sparkles className="text-amber-500 ml-1.5 inline size-3.5" />
                      ) : null}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {job.department || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {job.location || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-4 py-1 text-sm",
                          job.published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                        )}
                      >
                        {job.published ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground">
                      {dateFmt.format(new Date(job.updatedAt))}
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
                              setSelectedId(job.id);
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
                                const result = await deleteJob(job.id);
                                if (!result.ok) {
                                  setError(result.error);
                                  return;
                                }
                                setJobs((prev) => prev.filter((j) => j.id !== job.id));
                                if (selectedId === job.id) setSelectedId(null);
                                setSelectedIds((prev) => prev.filter((id) => id !== job.id));
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

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selected && !isFullJobView ? (
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
        {selected && !isFullJobView ? (
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
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  onClick={() => openJobFullView(selected)}
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
            {renderJobEditorFields()}
          </>
        ) : null}
      </aside>
      {savedHint}
    </div>
  );
}
