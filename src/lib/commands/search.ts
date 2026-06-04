import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

import type { CommandDefinition, CommandSearchResult } from "@/types/command";

const fuseOptions: IFuseOptions<CommandDefinition> = {
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
  keys: [
    { name: "title", weight: 0.55 },
    { name: "aliases", weight: 0.2 },
    { name: "keywords", weight: 0.2 },
    { name: "description", weight: 0.05 },
  ],
};

function classifyMatch(command: CommandDefinition, query: string): CommandSearchResult["matchType"] {
  const q = query.toLowerCase().trim();
  if (command.title.toLowerCase() === q) return "exact-title";
  if (command.aliases?.some((alias) => alias.toLowerCase() === q)) return "alias";
  if (command.keywords.some((keyword) => keyword.toLowerCase() === q)) return "keyword";
  return "fuzzy";
}

function scoreBoost(matchType: CommandSearchResult["matchType"]): number {
  if (matchType === "exact-title") return -0.45;
  if (matchType === "alias") return -0.2;
  if (matchType === "keyword") return -0.1;
  return 0;
}

export function createCommandSearchIndex(commands: CommandDefinition[]) {
  return new Fuse(commands, fuseOptions);
}

function keywordOverlapResults(
  commands: CommandDefinition[],
  normalized: string
): CommandSearchResult[] {
  const tokens = normalized
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9äöüß]/gi, ""))
    .filter((t) => t.length > 2);
  if (tokens.length === 0) return [];

  const scored = commands
    .map((command) => {
      const haystack = [
        command.title,
        command.description,
        ...command.keywords,
        ...(command.aliases ?? []),
      ]
        .join(" ")
        .toLowerCase();
      let hits = 0;
      for (const t of tokens) {
        if (haystack.includes(t)) hits += 1;
      }
      return { command, hits };
    })
    .filter((row) => row.hits > 0)
    .sort(
      (a, b) =>
        b.hits - a.hits || b.command.priority - a.command.priority || a.command.title.localeCompare(b.command.title)
    );

  return scored.slice(0, 16).map(({ command, hits }) => ({
    command,
    score: 0.22 - hits * 0.035 - command.priority / 1000,
    matchType: "keyword" as const,
  }));
}

export function runCommandSearch(
  fuse: Fuse<CommandDefinition>,
  commands: CommandDefinition[],
  query: string
): CommandSearchResult[] {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return commands.map((command) => ({
      command,
      score: -command.priority / 1000,
      matchType: "fuzzy",
    }));
  }

  const fused = fuse.search(normalized).map((result) => {
    const matchType = classifyMatch(result.item, normalized);
    const baseScore = result.score ?? 0;
    return {
      command: result.item,
      score: baseScore + scoreBoost(matchType) - result.item.priority / 1000,
      matchType,
    };
  });

  if (fused.length > 0) return fused;

  return keywordOverlapResults(commands, normalized);
}
