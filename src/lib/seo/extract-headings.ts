/** Extract heading lines from HTML or markdown content for SEO context. */
export function extractHeadingsFromContent(content: string): string[] {
  const headings: string[] = [];
  const trimmed = content.trim();
  if (!trimmed) return headings;

  const htmlMatches = trimmed.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
  for (const match of htmlMatches) {
    const text = stripTags(match[1] ?? "").trim();
    if (text) headings.push(text);
  }

  if (headings.length > 0) return uniqueHeadings(headings);

  for (const line of trimmed.split(/\n+/)) {
    const md = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (md?.[2]) {
      const text = md[2].trim();
      if (text) headings.push(text);
    }
  }

  return uniqueHeadings(headings);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueHeadings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= 12) break;
  }
  return out;
}

export function clipContentForSeo(content: string, max = 6000): string {
  const plain = content.includes("<")
    ? stripTags(content)
    : content.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max)}…`;
}
