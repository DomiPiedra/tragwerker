export type CommandCategory =
  | "Navigation"
  | "Content"
  | "Create"
  | "Settings"
  | "Quick Actions";

import type { CommandAttachment } from "@/types/command-attachment";
import type { CommandBarIntentPayload } from "@/types/command-intent";

export type CommandContext = {
  close: () => void;
  navigate: (path: string) => void;
  /** Files attached in the command bar (for AI / create flows). */
  attachments?: CommandAttachment[];
  /** Structured payload from AI intent (e.g. blog title + HTML content). */
  intent?: CommandBarIntentPayload;
};

export type CommandDefinition = {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  keywords: string[];
  aliases?: string[];
  shortcut?: string[];
  priority: number;
  icon?: string;
  action: (context: CommandContext) => void | Promise<void>;
  requiresRole?: "admin" | "editor" | "viewer";
  pinned?: boolean;
};

export type CommandSearchResult = {
  command: CommandDefinition;
  score: number;
  matchType: "exact-title" | "alias" | "keyword" | "fuzzy";
};
