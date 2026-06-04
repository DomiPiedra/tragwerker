import type { CommandImageUsage } from "@/types/command-intent";

export type BlogContentGenerationJob = {
  transcript: string;
  imageUsage: CommandImageUsage;
  attachments: Array<{
    id: string;
    url: string;
    title: string;
    originalName: string;
    mimeType: string;
  }>;
};

const STORAGE_PREFIX = "hcms-blog-generate:";

export function stashBlogContentGeneration(postId: string, job: BlogContentGenerationJob) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${STORAGE_PREFIX}${postId}`, JSON.stringify(job));
}

export function popBlogContentGeneration(postId: string): BlogContentGenerationJob | null {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_PREFIX}${postId}`;
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BlogContentGenerationJob;
  } catch {
    return null;
  }
}
