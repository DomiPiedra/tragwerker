import { cn } from "@/lib/utils";

import { looksLikeHtml } from "@/website/tragwerker/lib/html";

type SiteRichTextProps = {
  html: string;
  className?: string;
};

/** Renders CMS/TipTap HTML body copy for the public site. */
export function SiteRichText({ html, className }: SiteRichTextProps) {
  const trimmed = html.trim();
  if (!trimmed) return null;

  if (!looksLikeHtml(trimmed)) {
    return <p className={cn("site-rich-text", className)}>{trimmed}</p>;
  }

  return (
    <div
      className={cn("site-rich-text", className)}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  );
}
