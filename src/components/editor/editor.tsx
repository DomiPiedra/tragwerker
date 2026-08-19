"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";

import { runAIHandler } from "@/app/actions/ai-handler";
import { cn } from "@/lib/utils";

import { BubbleEditorMenu } from "./bubble-menu";
import { EDITOR_OPEN_MEDIA_PICKER_EVENT, EDITOR_OPEN_VIDEO_PICKER_EVENT } from "./editor-bridge";
import { EditorMediaPicker } from "./editor-media-picker";
import { EditorVideoPicker } from "./editor-video-picker";
import { ImageContextMenu } from "./image-context-menu";
import {
  ImageInteractions,
  type ImageDropHint,
  type ImageMenuState,
} from "./image-interactions-extension";
import { LayoutColumn, LayoutRow } from "./layout-row-extension";
import { SlashCommand } from "./slash-command";
import { EditorVideo } from "./video-extension";

export const EDITOR_SLASH_PLACEHOLDER = "press / to add elements";

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  handleAIEdit?: (content: string) => void;
  placeholder?: string;
  className?: string;
};

export function Editor({
  value,
  onChange,
  handleAIEdit,
  placeholder = EDITOR_SLASH_PLACEHOLDER,
  className,
}: EditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [replacePos, setReplacePos] = useState<number | null>(null);
  const [imageMenu, setImageMenu] = useState<ImageMenuState | null>(null);
  const [dropHint, setDropHint] = useState<ImageDropHint>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          openOnClick: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyCurrent: false,
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 48,
          minHeight: 48,
          alwaysPreserveAspectRatio: true,
        },
      }),
      LayoutColumn,
      LayoutRow,
      ImageInteractions,
      EditorVideo,
      Youtube.configure({
        modestBranding: true,
        width: 1280,
        height: 720,
        HTMLAttributes: {
          class: "max-h-full max-w-full rounded-md",
        },
      }),
      SlashCommand.configure({
        handleAICommand: async ({ text, range, editor: targetEditor }) => {
          const response = await runAIHandler({
            mode: "generate",
            text,
          });
          if (!response.ok) {
            handleAIEdit?.(response.error);
            return false;
          }
          if (!response.text.trim()) {
            handleAIEdit?.("AI returned empty output. Try a more specific prompt.");
            return false;
          }
          const from = Math.max(0, Math.min(range.from, targetEditor.state.doc.content.size));
          const to = Math.max(from, Math.min(range.to, targetEditor.state.doc.content.size));

          targetEditor.chain().focus().deleteRange({ from, to }).insertContentAt(from, response.text).run();
          return true;
        },
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose-premium min-h-[14rem] max-w-none px-1 py-1 focus:outline-none",
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      onChange(editorInstance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const storage = editor.storage.imageInteractions;
    if (!storage) return;
    storage.onMenuChange = setImageMenu;
    storage.onDropHintChange = setDropHint;
    return () => {
      storage.onMenuChange = null;
      storage.onDropHintChange = null;
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (current === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    function openMediaPicker() {
      setReplacePos(null);
      setMediaPickerOpen(true);
    }
    function openVideoPicker() {
      setVideoPickerOpen(true);
    }
    window.addEventListener(EDITOR_OPEN_MEDIA_PICKER_EVENT, openMediaPicker);
    window.addEventListener(EDITOR_OPEN_VIDEO_PICKER_EVENT, openVideoPicker);
    return () => {
      window.removeEventListener(EDITOR_OPEN_MEDIA_PICKER_EVENT, openMediaPicker);
      window.removeEventListener(EDITOR_OPEN_VIDEO_PICKER_EVENT, openVideoPicker);
    };
  }, []);

  const closeImageMenu = useCallback(() => {
    setImageMenu(null);
    if (editor?.storage.imageInteractions) {
      editor.storage.imageInteractions.menu = null;
    }
  }, [editor]);

  const openReplacePicker = useCallback((pos: number) => {
    setReplacePos(pos);
    setMediaPickerOpen(true);
  }, []);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-transparent bg-transparent px-2 py-1 caret-foreground focus-within:border-transparent focus-within:bg-transparent focus-within:shadow-none focus-within:ring-0",
        className
      )}
      onClick={() => editor.chain().focus().run()}
    >
      <BubbleEditorMenu editor={editor} />
      <EditorContent editor={editor} />

      {dropHint ? (
        <div
          aria-hidden
          data-side={dropHint.side}
          className="editor-image-drop-hint pointer-events-none fixed z-50"
          style={{
            left: dropHint.side === "left" ? dropHint.rect.left - 2 : dropHint.rect.right - 2,
            top: dropHint.rect.top,
            height: dropHint.rect.height,
          }}
        />
      ) : null}

      <ImageContextMenu
        editor={editor}
        menu={imageMenu}
        onClose={closeImageMenu}
        onReplace={openReplacePicker}
      />

      <EditorMediaPicker
        editor={editor}
        open={mediaPickerOpen}
        onOpenChange={(open) => {
          setMediaPickerOpen(open);
          if (!open) setReplacePos(null);
        }}
        replacePos={replacePos}
      />

      <EditorVideoPicker
        editor={editor}
        open={videoPickerOpen}
        onOpenChange={setVideoPickerOpen}
      />
    </div>
  );
}
