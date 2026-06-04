import { useEffect, useMemo, useState } from "react";

import { stripCommandIntentPrefixes } from "@/lib/commands/intent-strip";
import { getRegisteredCommands } from "@/lib/commands/registry";
import { createCommandSearchIndex, runCommandSearch } from "@/lib/commands/search";
import { useCommandBarStore } from "@/store/command-bar-store";
import type { CommandDefinition, CommandSearchResult } from "@/types/command";

type ContentItemSuggestion = {
  id: string;
  title: string;
  description: string;
  path: string;
  list: string;
  keywords: string[];
  priority: number;
};

export type ContentFillSuggestion = {
  id: string;
  title: string;
  list: string;
};

const CONTENT_SEARCH_DEBOUNCE_MS = 160;
const MAX_FILL_SUGGESTIONS = 8;

export function useCommandResults(queryOverride?: string): {
  commands: CommandDefinition[];
  results: CommandSearchResult[];
  contentLoading: boolean;
  contentFillSuggestions: ContentFillSuggestion[];
} {
  const storeQuery = useCommandBarStore((state) => state.query);
  const query = queryOverride ?? storeQuery;
  const recentIds = useCommandBarStore((state) => state.recentCommandIds);
  const pinnedIds = useCommandBarStore((state) => state.pinnedCommandIds);

  const commands = useMemo(() => getRegisteredCommands(), []);
  const [contentItems, setContentItems] = useState<ContentItemSuggestion[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const normalizedQuery = query.trim();
  const strippedQuery = stripCommandIntentPrefixes(normalizedQuery);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setContentItems([]);
      setContentLoading(false);
      return;
    }

    const controller = new AbortController();
    setContentLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/command/content-items?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal }
        );
        const data = (await response.json()) as { items?: ContentItemSuggestion[] };
        setContentItems(data.items ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setContentItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setContentLoading(false);
        }
      }
    }, CONTENT_SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setContentLoading(false);
    };
  }, [normalizedQuery]);

  const contentCommands = useMemo<CommandDefinition[]>(
    () => {
      if (normalizedQuery.length < 2) return [];
      return contentItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: "Content",
        keywords: [item.list.toLowerCase(), ...item.keywords.filter(Boolean)],
        aliases: [
          item.list,
          `${item.list} ${item.title}`,
          normalizedQuery,
          ...(strippedQuery.length >= 2 && strippedQuery !== normalizedQuery ? [strippedQuery] : []),
          item.title,
        ],
        priority: item.priority,
        icon: "Search",
        action: ({ navigate, close }) => {
          navigate(item.path);
          close();
        },
      }));
    },
    [contentItems, normalizedQuery, strippedQuery]
  );

  const mergedCommands = useMemo(
    () => [...contentCommands, ...commands],
    [commands, contentCommands]
  );

  const ordered = useMemo(() => {
    return [...mergedCommands].sort((a, b) => {
      const pinDelta = Number(pinnedIds.includes(b.id)) - Number(pinnedIds.includes(a.id));
      if (pinDelta !== 0) return pinDelta;
      const recentDelta = Number(recentIds.includes(b.id)) - Number(recentIds.includes(a.id));
      if (recentDelta !== 0) return recentDelta;
      return b.priority - a.priority;
    });
  }, [mergedCommands, pinnedIds, recentIds]);

  const fuse = useMemo(() => createCommandSearchIndex(ordered), [ordered]);
  const results = useMemo(() => runCommandSearch(fuse, ordered, query), [fuse, ordered, query]);

  const contentFillSuggestions = useMemo((): ContentFillSuggestion[] => {
    const seen = new Set<string>();
    const out: ContentFillSuggestion[] = [];
    for (const item of contentItems) {
      if (out.length >= MAX_FILL_SUGGESTIONS) break;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push({ id: item.id, title: item.title, list: item.list });
    }
    return out;
  }, [contentItems]);

  return {
    commands: ordered,
    results,
    contentLoading: normalizedQuery.length >= 2 && contentLoading,
    contentFillSuggestions,
  };
}
