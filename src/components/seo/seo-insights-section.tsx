"use client";

import { useCallback, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowRight,
  FileText,
  KeyRound,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { generateSeoInsightsAction } from "@/app/actions/content-seo";
import { Button } from "@/components/ui/button";
import type { ContentSeoEditorContext } from "@/lib/seo/editor-context";
import type {
  SeoInsightApplyPayload,
  SeoInsightsResult,
} from "@/lib/seo/ai/insights/types";
import { extractHeadingsFromContent } from "@/lib/seo/extract-headings";
import type { ContentSeo } from "@/types/seo";
import { cn } from "@/lib/utils";

type SeoInsightsSectionProps = {
  seoContext: ContentSeoEditorContext;
  seo: ContentSeo;
  disabled?: boolean;
  onApply: (payload: SeoInsightApplyPayload) => void;
};

type InsightCardProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  applyLabel?: string;
  onApply?: () => void;
  applied?: boolean;
  applyDisabled?: boolean;
};

function InsightCard({
  icon: Icon,
  title,
  children,
  applyLabel = "Apply",
  onApply,
  applied = false,
  applyDisabled = false,
}: InsightCardProps) {
  return (
    <article className="rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f4f4f5] text-foreground/55">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-medium tracking-tight text-foreground">{title}</h4>
          <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-foreground/70">
            {children}
          </div>
          {onApply ? (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={applyDisabled || applied}
                className="h-7 gap-1.5 border-black/8 bg-transparent px-2.5 text-[11px] font-medium shadow-none"
                onClick={onApply}
              >
                {applied ? "Applied" : applyLabel}
                {!applied ? <ArrowRight className="size-3 opacity-50" /> : null}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-xl border border-black/[0.04] bg-[#f4f4f5]"
        />
      ))}
    </div>
  );
}

export function SeoInsightsSection({
  seoContext,
  seo,
  disabled = false,
  onApply,
}: SeoInsightsSectionProps) {
  const [insights, setInsights] = useState<SeoInsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  const markApplied = useCallback((key: string) => {
    setAppliedKeys((prev) => new Set(prev).add(key));
  }, []);

  const handleApply = useCallback(
    (key: string, payload: SeoInsightApplyPayload) => {
      onApply(payload);
      markApplied(key);
    },
    [markApplied, onApply]
  );

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setAppliedKeys(new Set());
    try {
      const headings =
        seoContext.headings ?? extractHeadingsFromContent(seoContext.content);
      const result = await generateSeoInsightsAction({
        entityType: seoContext.entityType,
        entityId: seoContext.entityId,
        title: seoContext.title,
        content: seoContext.content,
        headings,
        existingMetadata: seo,
      });
      if (!result.ok) {
        setError(result.error);
        setInsights(null);
        return;
      }
      setInsights(result.insights);
    } finally {
      setLoading(false);
    }
  }

  const hasInsights = insights !== null;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.08em] text-foreground/45 uppercase">
            AI insights
          </p>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            Pre-publish review — recommendations only. Nothing changes until you apply.
          </p>
        </div>
        <span className="flex size-6 items-center justify-center rounded-md bg-[#f4f4f5] text-foreground/40">
          <Sparkles className="size-3.5" />
        </span>
      </div>

      {!hasInsights && !loading ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] px-4 py-5 text-center">
          <p className="text-[13px] leading-snug text-foreground/70">
            Get tailored SEO recommendations from your title, headings, content, and metadata.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 h-8 gap-1.5 border-black/10 bg-white text-[12px] font-medium shadow-sm"
            disabled={disabled || loading}
            onClick={() => void handleAnalyze()}
          >
            <Sparkles className="size-3.5" />
            Analyze page
          </Button>
        </div>
      ) : null}

      {loading ? <InsightsSkeleton /> : null}

      {error ? <p className="text-destructive text-center text-xs">{error}</p> : null}

      {hasInsights && !loading ? (
        <div className="space-y-2.5">
          {insights.suggestedSeoTitle ? (
            <InsightCard
              icon={Search}
              title="Suggested SEO title"
              applyLabel="Apply title"
              applied={appliedKeys.has("seoTitle")}
              applyDisabled={disabled}
              onApply={() =>
                handleApply("seoTitle", {
                  field: "seoTitle",
                  value: insights.suggestedSeoTitle!,
                })
              }
            >
              <p className="rounded-md bg-[#f7f7f7] px-2.5 py-2 font-mono text-[11px] text-foreground/80">
                {insights.suggestedSeoTitle}
              </p>
            </InsightCard>
          ) : null}

          {insights.suggestedMetaDescription ? (
            <InsightCard
              icon={FileText}
              title="Suggested meta description"
              applyLabel="Apply description"
              applied={appliedKeys.has("metaDescription")}
              applyDisabled={disabled}
              onApply={() =>
                handleApply("metaDescription", {
                  field: "seoDescription",
                  value: insights.suggestedMetaDescription!,
                })
              }
            >
              <p className="rounded-md bg-[#f7f7f7] px-2.5 py-2 text-foreground/80">
                {insights.suggestedMetaDescription}
              </p>
            </InsightCard>
          ) : null}

          {insights.suggestedKeywords.length > 0 ? (
            <InsightCard
              icon={KeyRound}
              title="Suggested keywords"
              applyLabel="Apply keywords"
              applied={appliedKeys.has("keywords")}
              applyDisabled={disabled}
              onApply={() =>
                handleApply("keywords", {
                  field: "seoKeywords",
                  value: insights.suggestedKeywords,
                })
              }
            >
              <ul className="flex flex-wrap gap-1.5">
                {insights.suggestedKeywords.map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-md border border-black/[0.06] bg-[#f7f7f7] px-2 py-0.5 text-[11px] text-foreground/75"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </InsightCard>
          ) : null}

          {insights.missingSearchIntent ? (
            <InsightCard icon={Target} title="Missing search intent">
              <p>{insights.missingSearchIntent.summary}</p>
              <ul className="space-y-1.5 border-t border-black/[0.05] pt-2">
                {insights.missingSearchIntent.suggestions.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-foreground/25 before:content-['']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </InsightCard>
          ) : null}

          {insights.suggestedInternalLinks.length > 0 ? (
            <InsightCard icon={Link2} title="Suggested internal links">
              <ul className="space-y-2.5">
                {insights.suggestedInternalLinks.map((link) => (
                  <li
                    key={`${link.anchorText}-${link.targetHint}`}
                    className="rounded-lg border border-black/[0.05] bg-[#fafafa] px-2.5 py-2"
                  >
                    <p className="font-medium text-foreground/85">
                      {link.anchorText}
                      <span className="text-foreground/35"> → </span>
                      <span className="font-mono text-[11px]">{link.targetHint}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-foreground/55">{link.reason}</p>
                  </li>
                ))}
              </ul>
            </InsightCard>
          ) : null}

          {insights.contentOpportunities.length > 0 ? (
            <InsightCard icon={FileText} title="Content opportunities">
              <ul className="space-y-2.5">
                {insights.contentOpportunities.map((item) => (
                  <li key={item.title}>
                    <p className="font-medium text-foreground/85">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-foreground/55">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </InsightCard>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full text-[12px] text-foreground/50"
            disabled={disabled || loading}
            onClick={() => void handleAnalyze()}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Refresh analysis
          </Button>
        </div>
      ) : null}
    </section>
  );
}
