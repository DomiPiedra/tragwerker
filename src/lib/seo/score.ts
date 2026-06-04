import { analyzePageContent, SEO_MIN_CONTENT_CHARS } from "@/lib/seo/analyze-content";
import type { ContentSeo } from "@/types/seo";

export type SeoCheckId =
  | "seoTitle"
  | "metaDescription"
  | "ogImage"
  | "h1"
  | "contentLength"
  | "hasImage"
  | "altText";

export type SeoCheckStatus = "pass" | "fail";

export type SeoCheck = {
  id: SeoCheckId;
  label: string;
  hint: string;
  status: SeoCheckStatus;
};

export type SeoWarningId =
  | "missingSeoTitle"
  | "missingMetaDescription"
  | "missingOgImage"
  | "missingAltText"
  | "shortContent";

export type SeoWarning = {
  id: SeoWarningId;
  message: string;
};

export type SeoScoreInput = {
  seo: ContentSeo;
  content?: string;
  pageTitle?: string;
};

export type SeoScoreResult = {
  score: number;
  checks: SeoCheck[];
  warnings: SeoWarning[];
  passedCount: number;
  totalChecks: number;
};

const CHECK_DEFINITIONS: Array<{
  id: SeoCheckId;
  label: string;
  hint: string;
  evaluate: (ctx: {
    seo: ContentSeo;
    analysis: ReturnType<typeof analyzePageContent>;
  }) => boolean;
}> = [
  {
    id: "seoTitle",
    label: "SEO title",
    hint: "Add a title for search results.",
    evaluate: ({ seo }) => seo.seoTitle.trim().length > 0,
  },
  {
    id: "metaDescription",
    label: "Meta description",
    hint: "Add a short summary for search snippets.",
    evaluate: ({ seo }) => seo.seoDescription.trim().length > 0,
  },
  {
    id: "ogImage",
    label: "OG image",
    hint: "Set a social preview image URL.",
    evaluate: ({ seo }) => seo.seoImage.trim().length > 0,
  },
  {
    id: "h1",
    label: "Primary heading",
    hint: "Use an H1 in the body or a clear page title.",
    evaluate: ({ analysis }) => analysis.hasH1,
  },
  {
    id: "contentLength",
    label: "Content length",
    hint: `Aim for at least ${SEO_MIN_CONTENT_CHARS} characters of body text.`,
    evaluate: ({ analysis }) => analysis.plainTextLength >= SEO_MIN_CONTENT_CHARS,
  },
  {
    id: "hasImage",
    label: "Visual media",
    hint: "Add at least one image to the page.",
    evaluate: ({ analysis }) => analysis.imageCount >= 1,
  },
  {
    id: "altText",
    label: "Image alt text",
    hint: "Describe each image for accessibility and SEO.",
    evaluate: ({ analysis }) =>
      analysis.imageCount === 0 || analysis.imagesMissingAlt === 0,
  },
];

const WARNING_BY_CHECK: Partial<Record<SeoCheckId, SeoWarning>> = {
  seoTitle: { id: "missingSeoTitle", message: "Missing SEO title" },
  metaDescription: { id: "missingMetaDescription", message: "Missing meta description" },
  ogImage: { id: "missingOgImage", message: "Missing OG image" },
  altText: { id: "missingAltText", message: "Missing alt text" },
  contentLength: { id: "shortContent", message: "Short content" },
};

/** Lightweight SEO readiness score with actionable checks and warnings. */
export function computeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const content = input.content ?? "";
  const pageTitle = input.pageTitle ?? "";
  const analysis = analyzePageContent(content, pageTitle);

  const checks: SeoCheck[] = CHECK_DEFINITIONS.map((def) => {
    const pass = def.evaluate({ seo: input.seo, analysis });
    return {
      id: def.id,
      label: def.label,
      hint: def.hint,
      status: pass ? "pass" : "fail",
    };
  });

  const passedCount = checks.filter((c) => c.status === "pass").length;
  const totalChecks = checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);

  const warnings: SeoWarning[] = [];
  for (const check of checks) {
    if (check.status === "pass") continue;
    const warning = WARNING_BY_CHECK[check.id];
    if (warning) warnings.push(warning);
  }

  return { score, checks, warnings, passedCount, totalChecks };
}

/** @deprecated Use {@link computeSeoScore} */
export function estimateSeoScore(seo: ContentSeo): number {
  return computeSeoScore({ seo }).score;
}
