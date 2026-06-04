export type CommandCategory =
  | "Navigation"
  | "Content"
  | "Create"
  | "Settings"
  | "Quick Actions";

export type CommandContext = {
  close: () => void;
  navigate: (path: string) => void;
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
