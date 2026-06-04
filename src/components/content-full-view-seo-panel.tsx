"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ScanSearch, Sparkles } from "lucide-react";

import {
  fetchContentSeoRecord,
  generateContentSeoAction,
  saveContentSeoAction,
} from "@/app/actions/content-seo";
import { SeoInsightsSection } from "@/components/seo/seo-insights-section";
import {
  ContentFullViewPanel,
  ContentFullViewPanelField,
  ContentFullViewPanelSection,
  ContentFullViewPanelTrigger,
} from "@/components/content-full-view-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SeoScoreOverview } from "@/components/seo/seo-score-overview";
import {
  computeSeoScore,
  createDefaultContentSeo,
  extractHeadingsFromContent,
  formatSeoGeneratedAgo,
  type ContentSeoEditorContext,
} from "@/lib/seo";
import type { SeoInsightApplyPayload } from "@/lib/seo/ai/insights/types";
import type { ContentSeo } from "@/types/seo";
import { cn } from "@/lib/utils";

type ContentFullViewSeoPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerClick: () => void;
  triggerActive?: boolean;
  seoContext?: ContentSeoEditorContext | null;
};

function keywordsToString(keywords: string[]): string {
  return keywords.filter(Boolean).join(", ");
}

function parseKeywordsInput(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function ContentFullViewSeoPanel({
  open,
  onOpenChange,
  onTriggerClick,
  triggerActive = false,
  seoContext = null,
}: ContentFullViewSeoPanelProps) {
  const [seo, setSeo] = useState<ContentSeo>(() => createDefaultContentSeo());
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(false);

  const scoreResult = useMemo(
    () =>
      computeSeoScore({
        seo,
        content: seoContext?.content ?? "",
        pageTitle: seoContext?.title ?? "",
      }),
    [seo, seoContext?.content, seoContext?.title]
  );
  const generatedAgo = formatSeoGeneratedAgo(aiGeneratedAt);
  const hasGenerated = Boolean(aiGeneratedAt?.trim());

  const loadRecord = useCallback(async () => {
    if (!seoContext) return;
    setLoadingRecord(true);
    setError(null);
    try {
      const result = await fetchContentSeoRecord({
        entityType: seoContext.entityType,
        entityId: seoContext.entityId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.seo) {
        setSeo({
          seoTitle: result.seo.seoTitle,
          seoDescription: result.seo.seoDescription,
          seoKeywords: result.seo.seoKeywords,
          seoImage: result.seo.seoImage,
          canonicalUrl: result.seo.canonicalUrl,
          indexable: result.seo.indexable,
          followLinks: result.seo.followLinks,
        });
        setAiGeneratedAt(result.seo.aiGeneratedAt);
      } else {
        setSeo(createDefaultContentSeo());
        setAiGeneratedAt(null);
      }
    } finally {
      setLoadingRecord(false);
    }
  }, [seoContext]);

  const seoEntityKey = seoContext
    ? `${seoContext.entityType}:${seoContext.entityId}`
    : null;

  useEffect(() => {
    if (!open || !seoEntityKey) return;
    void loadRecord();
  }, [open, seoEntityKey, loadRecord]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const persistSeo = useCallback(
    (next: ContentSeo) => {
      if (!seoContext) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        setError(null);
        try {
          const result = await saveContentSeoAction({
            entityType: seoContext.entityType,
            entityId: seoContext.entityId,
            seo: next,
          });
          if (!result.ok) {
            setError(result.error);
          }
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [seoContext]
  );

  function handleApplyInsight(payload: SeoInsightApplyPayload) {
    if (payload.field === "seoTitle" && typeof payload.value === "string") {
      updateSeo({ seoTitle: payload.value });
    } else if (payload.field === "seoDescription" && typeof payload.value === "string") {
      updateSeo({ seoDescription: payload.value });
    } else if (payload.field === "seoKeywords" && Array.isArray(payload.value)) {
      updateSeo({ seoKeywords: payload.value });
    }
  }

  function updateSeo(patch: Partial<ContentSeo>) {
    setSeo((prev) => {
      const next = { ...prev, ...patch };
      if (!skipNextSaveRef.current) {
        persistSeo(next);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!seoContext) return;
    setGenerating(true);
    setError(null);
    try {
      const headings =
        seoContext.headings ?? extractHeadingsFromContent(seoContext.content);
      const result = await generateContentSeoAction({
        entityType: seoContext.entityType,
        entityId: seoContext.entityId,
        title: seoContext.title,
        content: seoContext.content,
        headings,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      skipNextSaveRef.current = true;
      setSeo({
        seoTitle: result.seo.seoTitle,
        seoDescription: result.seo.seoDescription,
        seoKeywords: result.seo.seoKeywords,
        seoImage: result.seo.seoImage,
        canonicalUrl: result.seo.canonicalUrl,
        indexable: result.seo.indexable,
        followLinks: result.seo.followLinks,
      });
      setAiGeneratedAt(result.seo.aiGeneratedAt);
      skipNextSaveRef.current = false;
    } finally {
      setGenerating(false);
    }
  }

  const disabled = !seoContext || loadingRecord;

  return (
    <>
      <ContentFullViewPanelTrigger
        icon={ScanSearch}
        label="SEO"
        active={triggerActive}
        onClick={onTriggerClick}
      />
      <ContentFullViewPanel
        open={open}
        onOpenChange={onOpenChange}
        title="SEO"
        subtitle="AI-generated search metadata. Edit any field — suggestions are a starting point."
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full gap-2"
              disabled={disabled || generating}
              onClick={() => void handleGenerate()}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {hasGenerated ? "Regenerate" : "Generate SEO"}
            </Button>
            {generating ? (
              <p className="text-muted-foreground text-center text-xs" aria-live="polite">
                Generating metadata…
              </p>
            ) : generatedAgo ? (
              <p className="text-muted-foreground text-center text-xs">{generatedAgo}</p>
            ) : (
              <p className="text-muted-foreground text-center text-xs">
                Metadata is generated automatically when you save. Use the button to refresh from
                current content.
              </p>
            )}
            {saving ? (
              <p className="text-muted-foreground text-center text-[11px]">Saving…</p>
            ) : null}
            {error ? <p className="text-destructive text-center text-xs">{error}</p> : null}
          </div>

          <Separator className="bg-black/6" />

          <div
            className={cn(
              "relative",
              (loadingRecord || generating) && "pointer-events-none opacity-60"
            )}
            aria-busy={loadingRecord || generating}
          >
            {loadingRecord ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#fafafa]/80">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : null}
            <SeoScoreOverview result={scoreResult} />
          </div>

          <Separator className="bg-black/6" />

          {seoContext ? (
            <SeoInsightsSection
              seoContext={seoContext}
              seo={seo}
              disabled={disabled || loadingRecord || generating}
              onApply={handleApplyInsight}
            />
          ) : null}

          <Separator className="bg-black/6" />

          <ContentFullViewPanelSection title="AI Metadata">
            <div
              className={cn(
                "space-y-3",
                generating && "pointer-events-none opacity-60"
              )}
            >
              <ContentFullViewPanelField label="SEO Title">
                <Input
                  value={seo.seoTitle}
                  disabled={disabled}
                  placeholder="Page title for search results"
                  className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
                  onChange={(e) => updateSeo({ seoTitle: e.target.value })}
                />
              </ContentFullViewPanelField>
              <ContentFullViewPanelField label="Meta Description">
                <textarea
                  value={seo.seoDescription}
                  disabled={disabled}
                  rows={4}
                  placeholder="Short summary for search snippets"
                  className="border-input bg-[#f7f7f7] placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-[5rem] w-full rounded-lg border px-3 py-2 text-[13px] transition-colors outline-none focus-visible:border-ring focus-visible:ring-3"
                  onChange={(e) => updateSeo({ seoDescription: e.target.value })}
                />
              </ContentFullViewPanelField>
              <ContentFullViewPanelField label="Suggested Keywords">
                <Input
                  value={keywordsToString(seo.seoKeywords)}
                  disabled={disabled}
                  placeholder="keyword one, keyword two"
                  className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
                  onChange={(e) =>
                    updateSeo({ seoKeywords: parseKeywordsInput(e.target.value) })
                  }
                />
              </ContentFullViewPanelField>
            </div>
          </ContentFullViewPanelSection>

          <Separator className="bg-black/6" />

          <ContentFullViewPanelSection title="Open Graph">
            <ContentFullViewPanelField label="OG Title">
              <Input
                value={seo.seoTitle}
                disabled={disabled}
                className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
                onChange={(e) => updateSeo({ seoTitle: e.target.value })}
              />
            </ContentFullViewPanelField>
            <ContentFullViewPanelField label="OG Description">
              <textarea
                value={seo.seoDescription}
                disabled={disabled}
                rows={3}
                className="border-input bg-[#f7f7f7] min-h-[3.5rem] w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3"
                onChange={(e) => updateSeo({ seoDescription: e.target.value })}
              />
            </ContentFullViewPanelField>
            <ContentFullViewPanelField label="OG Image URL">
              <Input
                value={seo.seoImage}
                disabled={disabled}
                placeholder="https://…"
                className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
                onChange={(e) => updateSeo({ seoImage: e.target.value })}
              />
            </ContentFullViewPanelField>
          </ContentFullViewPanelSection>

          <Separator className="bg-black/6" />

          <ContentFullViewPanelSection title="Advanced">
            <ContentFullViewPanelField label="Canonical URL">
              <Input
                value={seo.canonicalUrl}
                disabled={disabled}
                placeholder="https://yoursite.com/page"
                className="h-9 border-black/8 bg-[#f7f7f7] text-[13px]"
                onChange={(e) => updateSeo({ canonicalUrl: e.target.value })}
              />
            </ContentFullViewPanelField>
            <ContentFullViewPanelField label="Indexing">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-black/8 bg-[#f7f7f7] px-3 py-2.5">
                <span className="text-[13px] text-foreground/70">Allow search indexing</span>
                <input
                  type="checkbox"
                  checked={seo.indexable}
                  disabled={disabled}
                  className="size-4 rounded border-black/20"
                  onChange={(e) => updateSeo({ indexable: e.target.checked })}
                />
              </label>
            </ContentFullViewPanelField>
            <ContentFullViewPanelField label="Follow links">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-black/8 bg-[#f7f7f7] px-3 py-2.5">
                <span className="text-[13px] text-foreground/70">Follow outbound links</span>
                <input
                  type="checkbox"
                  checked={seo.followLinks}
                  disabled={disabled}
                  className="size-4 rounded border-black/20"
                  onChange={(e) => updateSeo({ followLinks: e.target.checked })}
                />
              </label>
            </ContentFullViewPanelField>
          </ContentFullViewPanelSection>
        </div>
      </ContentFullViewPanel>
    </>
  );
}
