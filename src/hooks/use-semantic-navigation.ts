import { useEffect, useMemo } from "react";

import { getCommandMetadata } from "@/lib/commands/registry";
import { useCommandBarStore } from "@/store/command-bar-store";
import type { CommandDefinition, CommandSearchResult } from "@/types/command";

const DEBOUNCE_MS = 220;
const CACHE_TTL_MS = 5 * 60 * 1000;

function shouldUseSemanticFallback(query: string, results: CommandSearchResult[]): boolean {
  if (query.trim().length < 3) return false;
  if (results.length === 0) return true;

  const best = results[0];
  if (!best) return true;

  if (best.matchType === "exact-title" || best.matchType === "alias") return false;
  if (best.matchType === "keyword" && best.score <= 0.12) return false;
  return best.score > 0.08;
}

export function useSemanticNavigation({
  query,
  commands,
  results,
}: {
  query: string;
  commands: CommandDefinition[];
  results: CommandSearchResult[];
}) {
  const semanticCache = useCommandBarStore((state) => state.semanticCache);
  const setSemanticLoading = useCommandBarStore((state) => state.setSemanticLoading);
  const setSemanticResult = useCommandBarStore((state) => state.setSemanticResult);
  const cacheSemanticResult = useCommandBarStore((state) => state.cacheSemanticResult);
  const interpretedCommandId = useCommandBarStore((state) => state.interpretedCommandId);
  const interpretedConfidence = useCommandBarStore((state) => state.interpretedConfidence);

  const metadata = useMemo(() => getCommandMetadata(commands), [commands]);

  useEffect(() => {
    const q = query.trim();
    if (!shouldUseSemanticFallback(q, results)) {
      setSemanticResult(null);
      return;
    }

    const cacheKey = q.toLowerCase();
    const cached = semanticCache[cacheKey];
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      setSemanticResult({
        commandId: cached.commandId,
        confidence: cached.confidence,
        reasoning: cached.reasoning,
      });
      return;
    }

    setSemanticLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/command/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, commands: metadata }),
        });
        const data = (await response.json()) as {
          suggestion?: { commandId: string | null; confidence: number; reasoning: string } | null;
        };
        if (!data?.suggestion) {
          setSemanticResult(null);
          return;
        }
        cacheSemanticResult(cacheKey, data.suggestion);
        setSemanticResult(data.suggestion);
      } catch {
        setSemanticResult(null);
      } finally {
        setSemanticLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    cacheSemanticResult,
    metadata,
    query,
    results,
    semanticCache,
    setSemanticLoading,
    setSemanticResult,
  ]);

  const interpretedCommand = useMemo(
    () => commands.find((command) => command.id === interpretedCommandId) ?? null,
    [commands, interpretedCommandId]
  );

  return {
    interpretedCommand,
    interpretedConfidence,
  };
}
