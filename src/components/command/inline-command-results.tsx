"use client";

import { Sparkles } from "lucide-react";

import { CommandItem } from "@/components/command/command-item";
import { CommandSection } from "@/components/command/command-section";
import type { CommandCategory, CommandDefinition, CommandSearchResult } from "@/types/command";
import { cn } from "@/lib/utils";

const categoryOrder: CommandCategory[] = [
  "Navigation",
  "Content",
  "Create",
  "Quick Actions",
  "Settings",
];

type InlineCommandResultsProps = {
  query: string;
  results: CommandSearchResult[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  interpretedCommand: CommandDefinition | null;
  interpretedConfidence: number | null;
  contentLoading: boolean;
  semanticLoading: boolean;
  contentFillSuggestions: { id: string; title: string; list: string }[];
  onFillSuggestion: (title: string) => void;
  onExecute: (index: number) => void;
  onInterpretedExecute: () => void;
  className?: string;
};

export function InlineCommandResults({
  query,
  results,
  activeIndex,
  setActiveIndex,
  interpretedCommand,
  interpretedConfidence,
  contentLoading,
  semanticLoading,
  contentFillSuggestions,
  onFillSuggestion,
  onExecute,
  onInterpretedExecute,
  className,
}: InlineCommandResultsProps) {
  const grouped = new Map<CommandCategory, CommandSearchResult[]>();
  for (const category of categoryOrder) grouped.set(category, []);
  for (const result of results) {
    grouped.get(result.command.category)?.push(result);
  }

  const showSuggestions =
    query.trim().length >= 2 && (contentFillSuggestions.length > 0 || contentLoading);
  const showResults =
    query.trim().length > 0 || contentLoading || semanticLoading || results.length > 0;

  if (!showResults && !showSuggestions) return null;

  return (
    <div
      className={cn(
        "border-border/80 bg-background/98 mt-3 w-full overflow-hidden rounded-xl border shadow-sm",
        className
      )}
    >
      {showSuggestions ? (
        <div className="border-border/60 border-b px-4 py-3" role="listbox" aria-label="Content suggestions">
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between gap-2 text-[11px] tracking-wide uppercase">
            <span>Suggestions</span>
            {contentLoading ? <span className="normal-case">Finding matches…</span> : null}
          </div>
          {contentFillSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contentFillSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  role="option"
                  title="Fill search with this title"
                  className="border-border bg-muted/40 hover:bg-muted inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs transition-colors"
                  onClick={() => onFillSuggestion(suggestion.title)}
                >
                  <span className="text-muted-foreground shrink-0">{suggestion.list}</span>
                  <span className="truncate font-medium">{suggestion.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[min(40vh,320px)] overflow-y-auto p-2">
        {query.trim().length > 0 && interpretedCommand ? (
          <div className="mb-2 rounded-md border border-dashed p-1.5">
            <CommandSection title="Interpreted">
              <button
                type="button"
                onClick={onInterpretedExecute}
                className="bg-muted/60 hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left"
              >
                <div>
                  <p className="text-sm font-medium">{interpretedCommand.title}</p>
                  <p className="text-muted-foreground text-xs">{interpretedCommand.description}</p>
                </div>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                  <Sparkles className="size-3.5" />
                  Suggested{" "}
                  {interpretedConfidence ? `${Math.round(interpretedConfidence * 100)}%` : ""}
                </span>
              </button>
            </CommandSection>
          </div>
        ) : null}

        {contentLoading ? (
          <p className="text-muted-foreground px-2 pb-2 text-xs">
            Searching content across all lists...
          </p>
        ) : null}

        {semanticLoading ? (
          <p className="text-muted-foreground px-2 pb-2 text-xs">Interpreting intent…</p>
        ) : null}

        {results.length === 0 && query.trim().length > 0 && !contentLoading && !semanticLoading ? (
          <p className="text-muted-foreground px-2 py-4 text-sm">No matching commands.</p>
        ) : (
          categoryOrder.map((category) => {
            const section = grouped.get(category) ?? [];
            if (section.length === 0) return null;
            return (
              <CommandSection key={category} title={category}>
                {section.map((result) => {
                  const index = results.findIndex((x) => x.command.id === result.command.id);
                  return (
                    <CommandItem
                      key={result.command.id}
                      command={result.command}
                      active={activeIndex === index}
                      onHover={() => setActiveIndex(index)}
                      onExecute={() => onExecute(index)}
                    />
                  );
                })}
              </CommandSection>
            );
          })
        )}
      </div>
    </div>
  );
}
