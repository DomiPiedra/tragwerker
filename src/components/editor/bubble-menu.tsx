"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Link2, Strikethrough } from "lucide-react";

import { cn } from "@/lib/utils";
import { AIWriterExtension } from "./AIWriterExtension";

type BubbleEditorMenuProps = {
  editor: Editor;
};

function BubbleIconButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        active ? "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100" : "hover:bg-zinc-200/60 dark:hover:bg-zinc-700/70"
      )}
    >
      {children}
    </button>
  );
}

export function BubbleEditorMenu({ editor }: BubbleEditorMenuProps) {
  const [linkValue, setLinkValue] = useState("");

  function applyLink() {
    const value = linkValue.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`,
      })
      .run();
  }

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120 }}
      className="rounded-lg border border-zinc-200/50 bg-white/90 p-1 shadow-xl backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/90"
    >
      <div className="flex items-center gap-1">
        <BubbleIconButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </BubbleIconButton>
        <div className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
        <AIWriterExtension editor={editor} />
        <div className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
        <div className="flex items-center gap-1 pr-1">
          <Link2 className="size-3.5 text-zinc-500" />
          <input
            value={linkValue}
            onFocus={() => {
              setLinkValue(editor.getAttributes("link").href ?? "");
            }}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="Paste link"
            className="h-7 w-40 bg-transparent text-xs outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-700/70"
          >
            Apply
          </button>
        </div>
      </div>
    </TiptapBubbleMenu>
  );
}
