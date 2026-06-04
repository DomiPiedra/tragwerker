import type { CommandAttachment } from "@/types/command-attachment";

/** How attached images should be used when creating content. */
export type CommandImageUsage = "none" | "embed" | "reference";

export type BlogContentGenerationContext = {
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

export type CommandBarBlogPayload = {
  title: string;
  excerpt?: string;
  contentHtml: string;
  imageUsage: CommandImageUsage;
  /** When true, open editor immediately and generate body content in the background. */
  deferContentGeneration?: boolean;
  generationContext?: BlogContentGenerationContext;
};

export type CommandBarIntentPayload = {
  blog?: CommandBarBlogPayload;
};

export type CommandBarIntentResult = {
  commandId: string | null;
  confidence: number;
  reasoning: string;
  payload?: CommandBarIntentPayload;
};

export type ProcessCommandBarIntentInput = {
  transcript: string;
  commands: Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
    aliases: string[];
  }>;
  attachments?: CommandAttachment[];
};
