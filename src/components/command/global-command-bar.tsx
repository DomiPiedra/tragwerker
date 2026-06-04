"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Search } from "lucide-react";

import { processVoiceIntent } from "@/app/actions/processVoiceIntent";
import { useCommandResults } from "@/hooks/use-command-results";
import { useCommandShortcut } from "@/hooks/use-command-shortcut";
import { useSemanticNavigation } from "@/hooks/use-semantic-navigation";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { getCommandMetadata } from "@/lib/commands/registry";
import { useCommandBarStore } from "@/store/command-bar-store";
import type { CommandCategory } from "@/types/command";
import { cn } from "@/lib/utils";

import { CommandItem } from "./command-item";
import { CommandSection } from "./command-section";
import { VoiceButton } from "./voice-button";

const categoryOrder: CommandCategory[] = [
  "Navigation",
  "Content",
  "Create",
  "Quick Actions",
  "Settings",
];

export function GlobalCommandBar() {
  useCommandShortcut();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = useCommandBarStore((state) => state.isOpen);
  const query = useCommandBarStore((state) => state.query);
  const activeIndex = useCommandBarStore((state) => state.activeIndex);
  const close = useCommandBarStore((state) => state.close);
  const setQuery = useCommandBarStore((state) => state.setQuery);
  const setActiveIndex = useCommandBarStore((state) => state.setActiveIndex);
  const pushRecent = useCommandBarStore((state) => state.pushRecent);
  const semanticLoading = useCommandBarStore((state) => state.semanticLoading);
  const { commands, results, contentLoading, contentFillSuggestions } = useCommandResults();
  const semanticCommands = useMemo(
    () => commands.filter((command) => command.category !== "Content"),
    [commands]
  );
  const semanticResults = useMemo(
    () => results.filter((result) => result.command.category !== "Content"),
    [results]
  );
  const { interpretedCommand, interpretedConfidence } = useSemanticNavigation({
    query,
    commands: semanticCommands,
    results: semanticResults,
  });
  const [aiAuraBoost, setAiAuraBoost] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const commandMetadata = useMemo(() => getCommandMetadata(semanticCommands), [semanticCommands]);

  const { isRecording, toggle: toggleVoice } = useVoiceCommand({
    onInterim: (text) => {
      setQuery(text);
      setActiveIndex(0);
    },
    onFinal: (text) => {
      void handleAICommand(text);
    },
    onError: (message) => {
      setToastMessage(message);
      window.setTimeout(() => setToastMessage(null), 2600);
    },
  });
  const hasQuery = query.trim().length > 0;
  const listeningAura =
    semanticLoading || contentLoading || aiAuraBoost || isRecording || isTyping;
  const ringOpacity = isTyping ? 0.92 : listeningAura ? 0.56 : hasQuery ? 0.14 : 0.06;
  const spinDuration = isTyping ? 3.4 : 7;

  useEffect(() => {
    if (!isOpen) setIsTyping(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex < results.length) return;
    setActiveIndex(Math.max(0, results.length - 1));
  }, [activeIndex, results.length, setActiveIndex]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    const timer = window.setTimeout(() => setIsTyping(false), 420);
    return () => window.clearTimeout(timer);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<CommandCategory, typeof results>();
    for (const category of categoryOrder) map.set(category, []);
    for (const result of results) {
      map.get(result.command.category)?.push(result);
    }
    return map;
  }, [results]);

  async function execute(index: number) {
    const result = results[index];
    if (!result) return;
    const command = result.command;
    pushRecent(command.id);
    await command.action({
      close,
      navigate: (path) => router.push(path),
    });
  }

  async function handleAICommand(text: string) {
    const suggestion = await processVoiceIntent({
      transcript: text,
      commands: commandMetadata,
    });
    if (!suggestion || !suggestion.commandId || suggestion.confidence < 0.35) return;
    setAiAuraBoost(true);
    window.setTimeout(() => setAiAuraBoost(false), 700);
    await executeCommandById(suggestion.commandId);
  }

  async function executeCommandById(commandId: string) {
    const index = results.findIndex((result) => result.command.id === commandId);
    if (index >= 0) {
      await execute(index);
      return;
    }
    const command = commands.find((x) => x.id === commandId);
    if (!command) return;
    pushRecent(command.id);
    await command.action({
      close,
      navigate: (path) => router.push(path),
    });
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Command bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((activeIndex + 1) % Math.max(1, results.length));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex(
                (activeIndex - 1 + Math.max(1, results.length)) % Math.max(1, results.length)
              );
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (interpretedCommand) {
                setAiAuraBoost(true);
                window.setTimeout(() => setAiAuraBoost(false), 700);
              }
              void execute(activeIndex);
              return;
            }

            if (event.key === "Tab") {
              event.preventDefault();
              setActiveIndex((activeIndex + 1) % Math.max(1, results.length));
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, y: 10, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
            className="transform-gpu mx-auto mt-[12vh] w-[min(760px,92vw)]"
          >
            <div className="relative rounded-2xl p-px">
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9), rgba(59,130,246,0.9), rgba(99,102,241,0.9))",
                }}
                animate={{
                  rotate: 360,
                  opacity: ringOpacity,
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: spinDuration,
                  ease: "linear",
                }}
                initial={false}
                whileHover={!hasQuery && !listeningAura ? { opacity: 0.22 } : undefined}
              />
              <div className="bg-background/95 border-border relative rounded-2xl border shadow-2xl">
                <AnimatePresence>
                  {isTyping && !isRecording ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          boxShadow:
                            "0 0 0 1px rgba(99,102,241,0.5), 0 0 34px rgba(139,92,246,0.45), 0 0 72px rgba(59,130,246,0.25)",
                        }}
                        animate={{ opacity: [0.38, 0.82, 0.38] }}
                        transition={{
                          duration: 1.35,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence>
                  {isRecording ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          boxShadow:
                            "0 0 0 1px rgba(99,102,241,0.35), 0 0 30px rgba(99,102,241,0.35), 0 0 60px rgba(59,130,246,0.2)",
                        }}
                        animate={{ opacity: [0.45, 0.85, 0.45] }}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="border-border border-b">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Search className="text-muted-foreground size-4" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => {
                        setIsTyping(true);
                        setQuery(event.target.value);
                        setActiveIndex(0);
                      }}
                      placeholder="Type a command or content title…"
                      className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
                      aria-autocomplete="list"
                      aria-controls="isb-content-suggestions"
                      aria-expanded={
                        query.trim().length >= 2 && (contentFillSuggestions.length > 0 || contentLoading)
                      }
                    />
                    <VoiceButton isRecording={isRecording} onClick={toggleVoice} />
                    <kbd className="text-muted-foreground rounded border px-2 py-1 text-[11px]">ESC</kbd>
                  </div>
                  {query.trim().length >= 2 && (contentFillSuggestions.length > 0 || contentLoading) ? (
                    <div
                      id="isb-content-suggestions"
                      className="border-border/60 border-t px-4 pb-3 pt-2"
                      role="listbox"
                      aria-label="Content suggestions"
                    >
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
                              className={cn(
                                "border-border bg-muted/40 hover:bg-muted inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs transition-colors"
                              )}
                              onClick={() => {
                                setIsTyping(true);
                                setQuery(suggestion.title);
                                setActiveIndex(0);
                                window.requestAnimationFrame(() => inputRef.current?.focus());
                              }}
                            >
                              <span className="text-muted-foreground shrink-0">{suggestion.list}</span>
                              <span className="truncate font-medium">{suggestion.title}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <motion.div
                  layout
                  transition={{ type: "spring", duration: 0.3 }}
                  className="max-h-[55vh] overflow-y-auto p-2"
                >
          {query.trim().length > 0 && interpretedCommand ? (
            <div className="mb-2 rounded-md border border-dashed p-1.5">
              <CommandSection title="Interpreted">
                <button
                  type="button"
                  onClick={() => {
                    setAiAuraBoost(true);
                    window.setTimeout(() => setAiAuraBoost(false), 700);
                    void executeCommandById(interpretedCommand.id);
                  }}
                  className="bg-muted/60 hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{interpretedCommand.title}</p>
                    <p className="text-muted-foreground text-xs">{interpretedCommand.description}</p>
                  </div>
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                    <Sparkles className="size-3.5" />
                    Suggested {interpretedConfidence ? `${Math.round(interpretedConfidence * 100)}%` : ""}
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

          {results.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-sm">No matching commands.</p>
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
                        onHover={() => {
                          setActiveIndex(index);
                        }}
                        onExecute={() => {
                          void execute(index);
                        }}
                      />
                    );
                  })}
                </CommandSection>
              );
            })
          )}
                </motion.div>
              </div>
            </div>
          </motion.div>
          <AnimatePresence>
            {toastMessage ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-background/95 border-border absolute right-4 bottom-4 rounded-md border px-3 py-2 text-xs text-muted-foreground shadow-lg"
              >
                {toastMessage}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
