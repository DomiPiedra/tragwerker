import type { CommandImageUsage } from "@/types/command-intent";

const BLOG_CREATE_RE =
  /\b(create|new|write|start|make|add)\b.{0,40}\b(blog\s*post|blog|article|post)\b/i;

export function isBlogCreateRequest(transcript: string): boolean {
  return BLOG_CREATE_RE.test(transcript);
}

export function detectImageUsage(transcript: string, hasImages: boolean): CommandImageUsage {
  const t = transcript.toLowerCase();
  if (
    /\b(use|using)\b.{0,30}\b(picture|image|photo|file|attachment)\b.{0,40}\b(as\s+)?(a\s+)?referen/i.test(
      t
    ) ||
    /\breference\s+(the\s+)?(picture|image|photo|attachment)\b/i.test(t) ||
    /\b(picture|image|photo)\s+as\s+reference\b/i.test(t)
  ) {
    return "reference";
  }
  if (
    /\b(use|using|include|insert|add|put)\b.{0,30}\b(the\s+)?(added|attached|uploaded|this\s+)?(picture|image|photo|file)\b/i.test(
      t
    ) ||
    /\buse\s+added\s+picture\b/i.test(t) ||
    /\b(in|into|inside)\s+(the\s+)?(blog|post|article)\b/i.test(t) && hasImages
  ) {
    return "embed";
  }
  if (hasImages && isBlogCreateRequest(transcript)) return "embed";
  return "none";
}

export function extractBlogTitle(transcript: string): string | null {
  const patterns = [
    /\b(?:topic|subject|about|titled|title|called|on)\s+["']([^"']+)["']/i,
    /\b(?:topic|subject|about|titled|title|called|on)\s+([^.,;]+?)(?:\s+with\b|\s+using\b|[.,;]|$)/i,
    /\bblog\s+post\s+(?:with\s+)?(?:the\s+)?(?:topic\s+)?["']?([^"'.]+?)["']?(?:\s+with\b|\s+using\b|[.,]|$)/i,
    /\b(?:create|write|new)\s+(?:a\s+)?(?:blog\s+post|post|article)\s+(?:with\s+)?(?:the\s+)?(?:topic\s+)?["']?([^"'.]+?)["']?(?:\s+with\b|\s+using\b|[.,]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw || raw.length < 2) continue;
    const cleaned = raw
      .replace(/\b(the|a|an|with|using|and)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length >= 2 && cleaned.length <= 120) return cleaned;
  }
  return null;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBlogContentHtml(input: {
  bodyParagraphs: string[];
  imageUrl?: string;
  imageAlt?: string;
  imageUsage: CommandImageUsage;
}): string {
  const parts: string[] = [];
  for (const paragraph of input.bodyParagraphs) {
    const t = paragraph.trim();
    if (t) parts.push(`<p>${escapeHtml(t)}</p>`);
  }
  if (input.imageUsage === "embed" && input.imageUrl) {
    const alt = escapeHtml(input.imageAlt ?? "Attached image");
    const src = escapeHtml(input.imageUrl);
    parts.push(`<p><img src="${src}" alt="${alt}" /></p>`);
  }
  return parts.length > 0 ? parts.join("") : "<p></p>";
}
