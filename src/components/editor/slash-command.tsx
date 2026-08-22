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
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import {
  Columns2,
  Code2,
  Heading1,
  Heading2,
  Image as ImageIcon,
  List,
  Quote,
  Sparkles,
  Video,
} from "lucide-react";
import tippy, { type Instance as TippyInstance } from "tippy.js";

import { cn } from "@/lib/utils";

import { EDITOR_OPEN_MEDIA_PICKER_EVENT } from "./editor-bridge";

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

const SlashMenu = forwardRef<
  SlashMenuHandle,
  {
    items: SlashItem[];
    command: (item: SlashItem) => void;
    onPromptSubmit?: (prompt: string) => Promise<boolean | void> | boolean | void;
  }
>(function SlashMenu({ items, command, onPromptSubmit = async () => true }, ref) {
  const [selected, setSelected] = useState(0);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

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
    if (!value || isGenerating) return;
    setIsGenerating(true);
    try {
      await Promise.resolve(onPromptSubmit(value));
    } finally {
      if (!mountedRef.current) return;
      setIsGenerating(false);
    }
  }, [promptValue, isGenerating, onPromptSubmit]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (isPrompting) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!isGenerating) setIsPrompting(false);
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
        if (item.title === "AI Prompt") {
          setIsPrompting(true);
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
    return (
      <div className="relative w-80 rounded-xl">
        {isGenerating ? (
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
            isGenerating && "border-zinc-200/40 shadow-none dark:border-zinc-700/50"
          )}
        >
          <p className="mb-2 text-xs font-medium text-zinc-500">AI Prompt</p>
          <input
            ref={promptInputRef}
            value={promptValue}
            disabled={isGenerating}
            onChange={(event) => setPromptValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitPrompt();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                if (isGenerating) return;
                setIsPrompting(false);
              }
            }}
            placeholder="What should AI write?"
            className="mb-2 h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-300 disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-800"
          />
          {isGenerating ? (
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
                onClick={() => setIsPrompting(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                onClick={() => void submitPrompt()}
              >
                Generate
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
              if (item.title === "AI Prompt") {
                setIsPrompting(true);
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
              description: "Embed a YouTube video",
              icon: Video,
              command: ({ editor, range }) => {
                const url = window.prompt("Paste a YouTube URL");
                if (!url?.trim()) return;
                const trimmed = url.trim();
                if (!isValidYoutubeUrl(trimmed)) {
                  window.alert("That does not look like a valid YouTube link.");
                  return;
                }
                editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: trimmed }).run();
              },
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
                },
                editor: props.editor,
              });

              if (!props.clientRect) return;
              popup = tippy("body", {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
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
              });
              if (props.clientRect) {
                popup?.[0]?.setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(),
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
