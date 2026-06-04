/** Minimum plain-text body length for the content-length check. */
export const SEO_MIN_CONTENT_CHARS = 300;

export type ContentAnalysis = {
  plainTextLength: number;
  hasH1: boolean;
  imageCount: number;
  imagesWithAlt: number;
  imagesMissingAlt: number;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Inspect editor HTML or markdown for on-page SEO signals. */
export function analyzePageContent(content: string, pageTitle = ""): ContentAnalysis {
  const trimmed = content.trim();
  const plainText = trimmed.includes("<") ? stripHtml(trimmed) : trimmed.replace(/\s+/g, " ").trim();

  let hasH1 = false;
  if (/<h1[\s>]/i.test(trimmed)) {
    hasH1 = true;
  } else if (/^#\s+\S/im.test(trimmed)) {
    hasH1 = true;
  } else if (pageTitle.trim().length > 0 && !/<h[1-6][\s>]/i.test(trimmed)) {
    hasH1 = true;
  }

  const htmlImages = [...trimmed.matchAll(/<img\b[^>]*>/gi)];
  const markdownImages = [...trimmed.matchAll(/!\[([^\]]*)\]\([^)]+\)/g)];
  const imageCount = htmlImages.length + markdownImages.length;

  let imagesWithAlt = 0;
  let imagesMissingAlt = 0;

  for (const match of htmlImages) {
    const tag = match[0];
    const quoted = tag.match(/\balt=["']([^"']*)["']/i);
    const unquoted = tag.match(/\balt=([^\s>]+)/i);
    const alt = (quoted?.[1] ?? unquoted?.[1] ?? "").trim();
    if (alt) imagesWithAlt += 1;
    else imagesMissingAlt += 1;
  }

  for (const match of markdownImages) {
    const alt = (match[1] ?? "").trim();
    if (alt) imagesWithAlt += 1;
    else imagesMissingAlt += 1;
  }

  return {
    plainTextLength: plainText.length,
    hasH1,
    imageCount,
    imagesWithAlt,
    imagesMissingAlt,
  };
}
