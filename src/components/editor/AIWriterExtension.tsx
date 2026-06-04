"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Editor } from "@tiptap/react";
import { BriefcaseBusiness, Sparkles, WandSparkles } from "lucide-react";

import { runAIHandler } from "@/app/actions/ai-handler";
import { cn } from "@/lib/utils";

type AIWriterMode = "improve" | "professional" | "shorten" | "simplify";
type CompareState = {
  original: string;
  generated: string;
  range: { from: number; to: number };
};

const options: Array<{
  id: AIWriterMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "improve",
    label: "Improve Writing",
    description: "Polishes the tone",
    icon: WandSparkles,
  },
  {
    id: "professional",
    label: "Make it Professional",
    description: "Corporate and clean",
    icon: BriefcaseBusiness,
  },
  {
    id: "shorten",
    label: "Shorten",
    description: "Condenses the text",
    icon: Sparkles,
  },
  {
    id: "simplify",
    label: "Simplify",
    description: "Makes text easier to read",
    icon: Sparkles,
  },
];

export function AIWriterExtension({ editor }: { editor: Editor }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [compareState, setCompareState] = useState<CompareState | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(() => {
    const { from, to } = editor.state.selection;
    return to > from;
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const syncSelection = () => {
      const { from, to } = editor.state.selection;
      setHasSelection(to > from);
    };
    syncSelection();
    editor.on("selectionUpdate", syncSelection);
    editor.on("transaction", syncSelection);
    return () => {
      editor.off("selectionUpdate", syncSelection);
      editor.off("transaction", syncSelection);
    };
  }, [editor]);

  async function onGenerate(mode: AIWriterMode) {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ").trim();
    if (!selected) return;

    setError(null);
    setIsGenerating(true);
    setCompareState({
      original: selected,
      generated: "",
      range: { from, to },
    });
    setStreamedText("");

    try {
      const response = await runAIHandler({ mode, text: selected });
      if (!response.ok) {
        setIsGenerating(false);
        setCompareState(null);
        setError(response.error);
        if (response.reason === "rate_limit") {
          setToastMessage("AI is resting for a moment...");
          window.setTimeout(() => setToastMessage(null), 1800);
        }
        return;
      }

      const words = response.text.split(/\s+/).filter(Boolean);
      let index = 0;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        index += 1;
        setStreamedText(words.slice(0, index).join(" "));
        if (index >= words.length) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsGenerating(false);
          setCompareState((prev) => (prev ? { ...prev, generated: response.text } : prev));
        }
      }, 35);
    } catch {
      setIsGenerating(false);
      setCompareState(null);
      setError("AI rewrite failed. Please try again.");
    }
  }

  function replaceText() {
    if (!compareState?.generated) return;
    editor
      .chain()
      .focus()
      .insertContentAt(compareState.range, compareState.generated)
      .run();
    setCompareState(null);
    setStreamedText("");
    setIsMenuOpen(false);
  }

  function discard() {
    setCompareState(null);
    setStreamedText("");
    setIsGenerating(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!hasSelection}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors",
          hasSelection ? "hover:bg-zinc-200/60 dark:hover:bg-zinc-700/70" : "cursor-not-allowed opacity-45"
        )}
      >
        <Sparkles className="size-3.5" />
        AI Magic
      </button>

      {isMenuOpen ? (
        <div className="absolute top-9 right-0 z-50 w-72 rounded-xl border border-zinc-200/60 bg-white/90 p-2 shadow-xl backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/90">
          {!compareState ? (
            <div className="space-y-1">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70"
                    onClick={() => void onGenerate(option.id)}
                  >
                    <Icon className="mt-0.5 size-4 text-zinc-500" />
                    <span>
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-zinc-500">{option.description}</span>
                    </span>
                  </button>
                );
              })}
              {error ? <p className="px-1 pt-1 text-xs text-red-500">{error}</p> : null}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Compare</p>
              <div className="max-h-48 overflow-auto rounded-lg border border-zinc-200/60 bg-zinc-50/80 p-2 text-xs dark:border-zinc-700/60 dark:bg-zinc-800/70">
                <p className="mb-2 text-zinc-500">Original</p>
                <p className="mb-3 whitespace-pre-wrap">{compareState.original}</p>
                <p className="mb-2 text-zinc-500">AI Version</p>
                <motion.p
                  className={cn(
                    "whitespace-pre-wrap",
                    isGenerating &&
                      "bg-[conic-gradient(from_0deg,rgba(99,102,241,0.14),rgba(139,92,246,0.14),rgba(59,130,246,0.14),rgba(99,102,241,0.14))] bg-clip-text text-transparent"
                  )}
                  animate={isGenerating ? { opacity: [0.45, 1, 0.45] } : { opacity: 1 }}
                  transition={{
                    repeat: isGenerating ? Number.POSITIVE_INFINITY : 0,
                    duration: 1.1,
                    ease: "easeInOut",
                  }}
                >
                  {isGenerating ? streamedText : compareState.generated}
                </motion.p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md px-2.5 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={discard}
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={isGenerating || !compareState.generated}
                  className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  onClick={replaceText}
                >
                  Replace
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      <div
        className={cn(
          "pointer-events-none fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 rounded-full border border-zinc-200/70 bg-white/90 px-3 py-1.5 text-xs text-zinc-700 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:text-zinc-200",
          toastMessage ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {toastMessage ?? "AI is resting for a moment..."}
      </div>
    </div>
  );
}
