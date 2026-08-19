function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (url.hostname.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1] ?? null;
    }
  } catch {
    // ignore invalid URL
  }

  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
  return match?.[1] ?? null;
}

export function isValidPortfolioYoutubeUrl(input: string): boolean {
  return Boolean(extractYoutubeId(input));
}

export function toPortfolioYoutubeEmbedUrl(input: string): string | null {
  const id = extractYoutubeId(input);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function extractPortfolioYoutubeUrl(content: string): string {
  const match = content.match(/https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
  if (!match?.[1]) return "";
  return `https://www.youtube.com/watch?v=${match[1]}`;
}

function stripYoutubeEmbeds(content: string): string {
  return content
    .replace(/<div[^>]*data-youtube-video[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

export function upsertPortfolioYoutubeEmbed(content: string, input: string): string {
  const cleaned = stripYoutubeEmbeds(content);
  const embedUrl = toPortfolioYoutubeEmbedUrl(input);
  if (!embedUrl) return cleaned || "<p></p>";

  const embed = `<div data-youtube-video><iframe src="${embedUrl}" allowfullscreen="true" class="max-h-full max-w-full rounded-md"></iframe></div>`;
  if (!cleaned || cleaned === "<p></p>") return embed;
  return `${cleaned}\n${embed}`;
}
