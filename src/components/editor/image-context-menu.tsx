"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { Fragment } from "@tiptap/pm/model";
import {
  AlignHorizontalSpaceAround,
  ImageIcon,
  Maximize2,
  Replace,
  Trash2,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { ImageMenuState } from "./image-interactions-extension";

type ImageContextMenuProps = {
  editor: Editor;
  menu: ImageMenuState | null;
  onClose: () => void;
  onReplace: (pos: number) => void;
};

export function ImageContextMenu({ editor, menu, onClose, onReplace }: ImageContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState("");

  useEffect(() => {
    if (!menu?.open) {
      setEditingAlt(false);
      return;
    }
    setAltDraft(menu.alt);
    setEditingAlt(false);
  }, [menu]);

  useEffect(() => {
    if (!menu?.open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [menu?.open, onClose]);

  if (!menu?.open) return null;

  const style: CSSProperties = {
    position: "fixed",
    left: Math.min(menu.x, window.innerWidth - 220),
    top: Math.min(menu.y, window.innerHeight - 280),
    zIndex: 80,
  };

  function applyAtPos(fn: () => void) {
    const node = editor.state.doc.nodeAt(menu!.pos);
    if (!node || node.type.name !== "image") {
      onClose();
      return;
    }
    fn();
    onClose();
  }

  function saveAlt() {
    applyAtPos(() => {
      editor
        .chain()
        .focus()
        .setNodeSelection(menu!.pos)
        .updateAttributes("image", { alt: altDraft.trim() || null })
        .run();
    });
  }

  function resetSize() {
    applyAtPos(() => {
      editor
        .chain()
        .focus()
        .setNodeSelection(menu!.pos)
        .updateAttributes("image", { width: null, height: null })
        .run();
    });
  }

  function deleteImage() {
    applyAtPos(() => {
      if (menu!.inRow) {
        const $pos = editor.state.doc.resolve(menu!.pos);
        // Image lives inside layoutColumn → layoutRow
        if ($pos.parent.type.name !== "layoutColumn") {
          editor.chain().focus().setNodeSelection(menu!.pos).deleteSelection().run();
          return;
        }
        const colPos = $pos.before($pos.depth);
        const $col = editor.state.doc.resolve(colPos);
        if ($col.parent.type.name !== "layoutRow") {
          editor.chain().focus().setNodeSelection(menu!.pos).deleteSelection().run();
          return;
        }
        const rowPos = $col.before($col.depth);
        const row = $col.parent;
        const remainingCols: ReturnType<typeof row.child>[] = [];
        let childPos = rowPos + 1;
        for (let i = 0; i < row.childCount; i++) {
          const child = row.child(i);
          if (childPos !== colPos) remainingCols.push(child);
          childPos += child.nodeSize;
        }
        if (remainingCols.length === 1) {
          const blocks: import("@tiptap/pm/model").Node[] = [];
          remainingCols[0].forEach((child) => blocks.push(child));
          editor
            .chain()
            .focus()
            .command(({ tr, dispatch }) => {
              tr.replaceWith(rowPos, rowPos + row.nodeSize, Fragment.from(blocks));
              if (dispatch) dispatch(tr);
              return true;
            })
            .run();
        } else {
          editor.chain().focus().setNodeSelection(menu!.pos).deleteSelection().run();
        }
      } else {
        editor.chain().focus().setNodeSelection(menu!.pos).deleteSelection().run();
      }
    });
  }

  function splitRow() {
    applyAtPos(() => {
      const $pos = editor.state.doc.resolve(menu!.pos);
      if ($pos.parent.type.name !== "layoutColumn") return;
      const colPos = $pos.before($pos.depth);
      const $col = editor.state.doc.resolve(colPos);
      if ($col.parent.type.name !== "layoutRow") return;
      const rowPos = $col.before($col.depth);
      editor.chain().focus().unwrapLayoutRow(rowPos).run();
    });
  }

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "bg-popover text-popover-foreground border-border w-[200px] overflow-hidden rounded-lg border shadow-lg"
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {editingAlt ? (
        <div className="space-y-2 p-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Alt text
          </p>
          <Input
            autoFocus
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            placeholder="Describe the image"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveAlt();
              }
            }}
          />
          <div className="flex justify-end gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAlt(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={saveAlt}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col py-1">
          <MenuItem
            icon={<Replace className="size-3.5" />}
            label="Replace image"
            onClick={() => {
              onReplace(menu.pos);
              onClose();
            }}
          />
          <MenuItem
            icon={<Type className="size-3.5" />}
            label="Edit alt text"
            onClick={() => setEditingAlt(true)}
          />
          <MenuItem
            icon={<Maximize2 className="size-3.5" />}
            label="Reset size"
            onClick={resetSize}
          />
          {menu.inRow ? (
            <MenuItem
              icon={<AlignHorizontalSpaceAround className="size-3.5" />}
              label="Stack vertically"
              onClick={splitRow}
            />
          ) : null}
          <div className="bg-border my-1 h-px" />
          <MenuItem
            icon={<Trash2 className="size-3.5" />}
            label="Delete"
            destructive
            onClick={deleteImage}
          />
          <div className="text-muted-foreground flex items-center gap-1.5 px-2.5 py-1.5 text-[10px]">
            <ImageIcon className="size-3 opacity-60" />
            Drag corners to resize
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "hover:bg-muted flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors",
        destructive && "text-destructive hover:bg-destructive/10"
      )}
      onClick={onClick}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}
