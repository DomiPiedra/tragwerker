"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/react";
import { Extension, ReactRenderer } from "@tiptap/react";
import { motion } from "framer-motion";
import {
  Columns2,
  Code2,
  FileVideo,
  Heading1,
  Heading2,
  Image as ImageIcon,
  List,
  Play,
  Quote,
  Sparkles,
} from "lucide-react";
import tippy, { type Instance as TippyInstance } from "tippy.js";

import { isValidPortfolioYoutubeUrl } from "@/lib/portfolio/youtube";
import { cn } from "@/lib/utils";

import { EDITOR_OPEN_MEDIA_PICKER_EVENT, EDITOR_OPEN_VIDEO_PICKER_EVENT } from "./editor-bridge";

type SlashItem = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  command: (args: { editor: Editor; range: { from: number; to: number } }) => void;
};
type AICommandPayload = {
  text: string;
  range: { from: number; to: number };
  editor: Editor;
};

type SlashMenuHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  getSelectedIndex: () => number;
};

const GENERATING_LABEL = "Generating…";

type PromptKind = "ai" | "youtube";

const SlashMenu = forwardRef<
  SlashMenuHandle,
  {
    items: SlashItem[];
    command: (item: SlashItem) => void;
    onPromptSubmit?: (prompt: string) => Promise<boolean | void> | boolean | void;
    onYoutubeSubmit?: (url: string) => boolean | void;
    onDismiss?: () => void;
  }
>(function SlashMenu(
  { items, command, onPromptSubmit = async () => true, onYoutubeSubmit = () => false, onDismiss },
  ref
) {
  const [selected, setSelected] = useState(0);
  const [promptKind, setPromptKind] = useState<PromptKind | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

  const isPrompting = promptKind !== null;

  function openPrompt(kind: PromptKind) {
    setPromptKind(kind);
    setPromptValue("");
    setYoutubeError(null);
  }

  function closePrompt() {
    setPromptKind(null);
    setPromptValue("");
    setYoutubeError(null);
  }

  function promptKindForItem(title: string): PromptKind | null {
    if (title === "AI Prompt") return "ai";
    if (title === "YouTube") return "youtube";
    return null;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isPrompting) return;
    promptInputRef.current?.focus();
  }, [isPrompting]);

  useEffect(() => {
    if (!isPrompting) return;
    if (selected >= items.length) {
      setSelected(0);
    }
  }, [isPrompting, items.length, selected]);

  const submitPrompt = useCallback(async () => {
    const value = promptValue.trim();
    if (!value || isGenerating || !promptKind) return;

    if (promptKind === "youtube") {
      if (!isValidPortfolioYoutubeUrl(value)) {
        setYoutubeError("Enter a valid YouTube URL.");
        return;
      }
      const ok = onYoutubeSubmit(value);
      if (ok) {
        closePrompt();
        onDismiss?.();
      }
      return;
    }

    setIsGenerating(true);
    try {
      await Promise.resolve(onPromptSubmit(value));
      closePrompt();
      onDismiss?.();
    } finally {
      if (!mountedRef.current) return;
      setIsGenerating(false);
    }
  }, [promptValue, isGenerating, onDismiss, onPromptSubmit, onYoutubeSubmit, promptKind]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (isPrompting) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!isGenerating) closePrompt();
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          void submitPrompt();
          return true;
        }
        return false;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = items[selected];
        if (!item) return true;
        const kind = promptKindForItem(item.title);
        if (kind) {
          openPrompt(kind);
          return true;
        }
        command(item);
        return true;
      }
      return false;
    },
    getSelectedIndex: () => selected,
  }), [command, isGenerating, isPrompting, items, selected, submitPrompt]);

  if (items.length === 0) return null;

  if (isPrompting) {
    const isYoutube = promptKind === "youtube";

    return (
      <div className="relative w-80 rounded-xl">
        {!isYoutube && isGenerating ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 rounded-2xl opacity-90 blur-2xl"
              style={{
                background:
                  "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(139,92,246,0.42), transparent 72%), radial-gradient(ellipse 90% 75% at 50% 55%, rgba(59,130,246,0.32), transparent 75%), radial-gradient(ellipse 70% 60% at 50% 40%, rgba(99,102,241,0.28), transparent 68%)",
              }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 rounded-xl"
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
          </>
        ) : null}
        <div
          className={cn(
            "relative rounded-[10px] border border-zinc-200/70 bg-white/95 p-2 shadow-xl backdrop-blur-md dark:border-zinc-700/70 dark:bg-zinc-900/95",
            !isYoutube && isGenerating && "border-zinc-200/40 shadow-none dark:border-zinc-700/50"
          )}
        >
          <p className="mb-2 text-xs font-medium text-zinc-500">
            {isYoutube ? "YouTube" : "AI Prompt"}
          </p>
          <input
            ref={promptInputRef}
            value={promptValue}
            disabled={isGenerating}
            onChange={(event) => {
              setPromptValue(event.target.value);
              if (youtubeError) setYoutubeError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitPrompt();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                if (isGenerating) return;
                closePrompt();
              }
            }}
            placeholder={
              isYoutube ? "https://www.youtube.com/watch?v=…" : "What should AI write?"
            }
            className="mb-2 h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-300 disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-800"
          />
          {youtubeError ? <p className="text-destructive mb-2 text-xs">{youtubeError}</p> : null}
          {!isYoutube && isGenerating ? (
            <div className="mb-3 flex min-h-[1.25rem] items-center justify-center gap-[1px] py-1">
              {GENERATING_LABEL.split("").map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  className="inline-block bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 bg-clip-text text-sm font-semibold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-blue-400"
                  animate={{
                    y: [0, -5, 0],
                    opacity: [0.35, 1, 0.35],
                  }}
                  transition={{
                    duration: 1.15,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: i * 0.055,
                  }}
                >
                  {ch === " " ? "\u00a0" : ch}
                </motion.span>
              ))}
            </div>
          ) : null}
          {!isGenerating ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-2.5 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={closePrompt}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                onClick={() => void submitPrompt()}
              >
                {isYoutube ? "Embed" : "Generate"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 rounded-xl border border-zinc-200/70 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-700/70 dark:bg-zinc-900/95">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
              index === selected ? "bg-zinc-200/70 dark:bg-zinc-800/80" : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
            )}
            onMouseEnter={() => setSelected(index)}
            onClick={() => {
              const kind = promptKindForItem(item.title);
              if (kind) {
                openPrompt(kind);
                return;
              }
              command(item);
            }}
          >
            <Icon className="mt-0.5 size-4 text-zinc-500" />
            <span>
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="text-xs text-zinc-500">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

export const SlashCommand = Extension.create<{
  handleAICommand?: (payload: AICommandPayload) => boolean | Promise<boolean>;
}>({
  name: "slash-command",

  addOptions() {
    return {
      handleAICommand: async () => false,
    };
  },

  addProseMirrorPlugins() {
    const safeHandleAICommand = async (payload: AICommandPayload) => {
      const fn = this.options?.handleAICommand;
      if (typeof fn === "function") {
        const result = await fn(payload);
        return result !== false;
      }
      return false;
    };

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        allowSpaces: true,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          const items: SlashItem[] = [
            {
              title: "Heading 1",
              description: "Large section heading",
              icon: Heading1,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
            },
            {
              title: "Heading 2",
              description: "Medium section heading",
              icon: Heading2,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
            },
            {
              title: "Bullet List",
              description: "Start a bulleted list",
              icon: List,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).toggleBulletList().run(),
            },
            {
              title: "Quote",
              description: "Insert a quote block",
              icon: Quote,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
            },
            {
              title: "Code",
              description: "Insert a code block",
              icon: Code2,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
            },
            {
              title: "Image",
              description: "Upload or choose from media library",
              icon: ImageIcon,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                queueMicrotask(() => {
                  window.dispatchEvent(new CustomEvent(EDITOR_OPEN_MEDIA_PICKER_EVENT));
                });
              },
            },
            {
              title: "Columns",
              description: "Two columns side by side",
              icon: Columns2,
              command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).insertEmptyColumns().run(),
            },
            {
              title: "Video",
              description: "Upload or choose from media library",
              icon: FileVideo,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                queueMicrotask(() => {
                  window.dispatchEvent(new CustomEvent(EDITOR_OPEN_VIDEO_PICKER_EVENT));
                });
              },
            },
            {
              title: "YouTube",
              description: "Embed a YouTube video",
              icon: Play,
              command: () => {},
            },
            {
              title: "AI Prompt",
              description: "Generate full text from prompt",
              icon: Sparkles,
              command: () => {},
            },
          ];
          return items
            .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);
        },
        render: () => {
          let component: ReactRenderer<SlashMenuHandle> | null = null;
          let popup: TippyInstance[] | null = null;
          let promptContext: { editor: Editor; range: { from: number; to: number } } | null = null;
          const makePromptSubmit =
            () => async (prompt: string) => {
              if (!promptContext) return false;
              const { editor, range } = promptContext;
              return Boolean(
                await safeHandleAICommand({
                  text: prompt,
                  range,
                  editor,
                }),
              );
            };

          const makeYoutubeSubmit =
            () => (url: string) => {
              if (!promptContext) return false;
              const { editor, range } = promptContext;
              const trimmed = url.trim();
              if (!trimmed || !isValidPortfolioYoutubeUrl(trimmed)) return false;
              editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: trimmed }).run();
              return true;
            };

          return {
            onStart: (props) => {
              if (props.range) {
                promptContext = { editor: props.editor, range: props.range };
              }
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items as SlashItem[],
                  command: (item: SlashItem) => props.command(item),
                  onPromptSubmit: makePromptSubmit(),
                  onYoutubeSubmit: makeYoutubeSubmit(),
                  onDismiss: () => popup?.[0]?.hide(),
                },
                editor: props.editor,
              });

              if (!props.clientRect) return;
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate(props) {
              if (props.range) {
                promptContext = { editor: props.editor, range: props.range };
              }
              component?.updateProps({
                items: props.items as SlashItem[],
                command: (item: SlashItem) => props.command(item),
                onPromptSubmit: makePromptSubmit(),
                onYoutubeSubmit: makeYoutubeSubmit(),
                onDismiss: () => popup?.[0]?.hide(),
              });
              if (props.clientRect) {
                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },
            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              const handledByMenu = component?.ref?.onKeyDown(props) ?? false;
              if (handledByMenu) return true;

              return false;
            },
            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
              popup = null;
              component = null;
              promptContext = null;
            },
          };
        },
      }),
    ];
  },
});
