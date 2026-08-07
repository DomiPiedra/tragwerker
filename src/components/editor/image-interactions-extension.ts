"use client";

import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

export type ImageMenuState = {
  open: boolean;
  x: number;
  y: number;
  pos: number;
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  inRow: boolean;
};

export type ImageDropHint = {
  pos: number;
  side: "left" | "right";
  rect: DOMRect;
} | null;

type ImageInteractionsStorage = {
  menu: ImageMenuState | null;
  dropHint: ImageDropHint;
  onMenuChange: ((menu: ImageMenuState | null) => void) | null;
  onDropHintChange: ((hint: ImageDropHint) => void) | null;
};

type DraggedBlockPayload = {
  pos: number;
  kind: "block";
};

type DraggedImagePayload = {
  pos: number;
  kind?: "image";
  src: string;
  alt: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
};

declare module "@tiptap/core" {
  interface Storage {
    imageInteractions: ImageInteractionsStorage;
  }
}

const pluginKey = new PluginKey("imageInteractions");
const handlesPluginKey = new PluginKey("blockDragHandles");
const DRAG_MIME = "application/x-hcms-editor-image";
const BLOCK_DRAG_MIME = "application/x-hcms-editor-block";
const DRAG_TEXT_PREFIX = "hcms-editor-image:";
const BLOCK_TEXT_PREFIX = "hcms-editor-block:";

function encodeDragPayload(payload: DraggedImagePayload): string {
  return `${DRAG_TEXT_PREFIX}${JSON.stringify(payload)}`;
}

function encodeBlockPayload(payload: DraggedBlockPayload): string {
  return `${BLOCK_TEXT_PREFIX}${JSON.stringify(payload)}`;
}

function getDraggedImagePayload(event: DragEvent): DraggedImagePayload | null {
  const rawMime = event.dataTransfer?.getData(DRAG_MIME);
  const rawText = event.dataTransfer?.getData("text/plain") ?? "";
  const raw =
    rawMime || (rawText.startsWith(DRAG_TEXT_PREFIX) ? rawText.slice(DRAG_TEXT_PREFIX.length) : "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DraggedImagePayload;
  } catch {
    return null;
  }
}

function getDraggedBlockPayload(event: DragEvent): DraggedBlockPayload | null {
  const rawMime = event.dataTransfer?.getData(BLOCK_DRAG_MIME);
  const rawText = event.dataTransfer?.getData("text/plain") ?? "";
  const raw =
    rawMime ||
    (rawText.startsWith(BLOCK_TEXT_PREFIX) ? rawText.slice(BLOCK_TEXT_PREFIX.length) : "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraggedBlockPayload;
    if (typeof parsed.pos === "number") return parsed;
  } catch {
    // ignore
  }
  return null;
}

function isImageNode(node: ProseMirrorNode | null | undefined): node is ProseMirrorNode {
  return Boolean(node && node.type.name === "image");
}

function sideFromRect(clientX: number, rect: DOMRect): "left" | "right" {
  return clientX < rect.left + rect.width / 2 ? "left" : "right";
}

function nodeDomRect(view: EditorView, pos: number): DOMRect | null {
  const dom = view.nodeDOM(pos);
  if (dom instanceof HTMLElement) return dom.getBoundingClientRect();
  if (dom instanceof Element) return dom.getBoundingClientRect();
  return null;
}

/** Top-level doc child under the pointer (paragraph, heading, image, layoutRow, …). */
function findTopLevelBlockHit(
  view: EditorView,
  clientX: number,
  clientY: number,
  excludePos?: number | null
): { pos: number; side: "left" | "right"; rect: DOMRect; node: ProseMirrorNode } | null {
  const coords = view.posAtCoords({ left: clientX, top: clientY });
  if (!coords) return null;

  const resolvedPos = coords.inside >= 0 ? coords.inside : coords.pos;
  const $pos = view.state.doc.resolve(Math.min(resolvedPos, view.state.doc.content.size));

  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth - 1).type.name !== "doc") continue;
    const pos = $pos.before(depth);
    if (excludePos != null && pos === excludePos) return null;
    const node = $pos.node(depth);
    const rect = nodeDomRect(view, pos);
    if (!rect) return null;
    return { pos, side: sideFromRect(clientX, rect), rect, node };
  }

  return null;
}

/** Resolve an image node under the pointer (resize wrappers included). */
function findImageHit(
  view: EditorView,
  clientX: number,
  clientY: number,
  excludePos?: number | null
): { pos: number; side: "left" | "right"; rect: DOMRect } | null {
  const stack = document.elementsFromPoint(clientX, clientY);

  for (const el of stack) {
    if (!(el instanceof Element) || !view.dom.contains(el)) continue;

    const container =
      el.closest<HTMLElement>('[data-resize-container][data-node="image"]') ??
      (el.matches?.('[data-resize-container][data-node="image"]') ? (el as HTMLElement) : null);

    const img =
      container?.querySelector("img") ??
      (el instanceof HTMLImageElement ? el : el.closest("img"));

    if (!img || !view.dom.contains(img)) continue;

    const anchor = container ?? img;
    let pos = -1;
    try {
      pos = view.posAtDOM(anchor, 0);
    } catch {
      const coords = view.posAtCoords({ left: clientX, top: clientY });
      if (!coords) continue;
      pos = coords.inside >= 0 ? coords.inside : coords.pos;
    }

    let node = view.state.doc.nodeAt(pos);
    if (!isImageNode(node)) {
      const coords = view.posAtCoords({
        left: anchor.getBoundingClientRect().left + 4,
        top: anchor.getBoundingClientRect().top + 4,
      });
      if (coords) {
        for (const candidate of [coords.inside, coords.pos, coords.pos - 1]) {
          if (candidate < 0) continue;
          const n = view.state.doc.nodeAt(candidate);
          if (isImageNode(n)) {
            pos = candidate;
            node = n;
            break;
          }
        }
      }
    }

    if (!isImageNode(node)) continue;
    if (excludePos != null && pos === excludePos) continue;

    const $pos = view.state.doc.resolve(pos);
    if ($pos.parent.type.name === "layoutColumn") {
      const src = img.getAttribute("src");
      let childPos = $pos.before($pos.depth) + 1;
      for (let i = 0; i < $pos.parent.childCount; i++) {
        const child = $pos.parent.child(i);
        if (child.type.name === "image" && src && child.attrs.src === src) {
          pos = childPos;
          node = child;
          break;
        }
        childPos += child.nodeSize;
      }
    }

    const rect = anchor.getBoundingClientRect();
    return { pos, side: sideFromRect(clientX, rect), rect };
  }

  return null;
}

function extractBlockFromSlice(slice: { content: ProseMirrorNode["content"] }): ProseMirrorNode | null {
  if (slice.content.childCount === 1) {
    return slice.content.child(0);
  }
  return null;
}

async function uploadImageFile(file: File): Promise<{ url: string; alt: string | null } | null> {
  const fd = new FormData();
  fd.append("files", file);
  try {
    const res = await fetch("/api/media/upload", { method: "POST", body: fd });
    const data = (await res.json()) as {
      ok?: boolean;
      items?: Array<{ url: string; altText: string | null; title: string }>;
    };
    if (!res.ok || !data.ok || !data.items?.[0]?.url) return null;
    const row = data.items[0];
    return { url: row.url, alt: row.altText ?? row.title };
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function clearHint(extension: { storage: ImageInteractionsStorage }) {
  if (!extension.storage.dropHint) return;
  extension.storage.dropHint = null;
  extension.storage.onDropHintChange?.(null);
}

function setHint(
  extension: { storage: ImageInteractionsStorage },
  hint: NonNullable<ImageDropHint>
) {
  extension.storage.dropHint = hint;
  extension.storage.onDropHintChange?.(hint);
}

function disableNativeImageDrag(root: HTMLElement) {
  root.querySelectorAll<HTMLImageElement>('[data-resize-container][data-node="image"] img').forEach((img) => {
    if (img.draggable) img.draggable = false;
  });
}

function isImageInLayoutColumn(view: EditorView, pos: number): boolean {
  const $pos = view.state.doc.resolve(pos);
  return $pos.parent.type.name === "layoutColumn";
}

function placeBeside(
  extension: { editor: { commands: { placeBlockBeside: (i: {
    targetPos: number;
    side: "left" | "right";
    incoming: ProseMirrorNode;
    sourcePos?: number | null;
  }) => boolean } } },
  targetPos: number,
  side: "left" | "right",
  incoming: ProseMirrorNode,
  sourcePos?: number | null
): boolean {
  return extension.editor.commands.placeBlockBeside({
    targetPos,
    side,
    incoming,
    sourcePos,
  });
}

export const ImageInteractions = Extension.create({
  name: "imageInteractions",

  addStorage() {
    return {
      menu: null,
      dropHint: null,
      onMenuChange: null,
      onDropHintChange: null,
    } satisfies ImageInteractionsStorage;
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: handlesPluginKey,
        props: {
          decorations(state) {
            const decorations: ReturnType<typeof Decoration.widget>[] = [];
            const { doc } = state;
            doc.forEach((node, offset) => {
              const blockPos = offset;
              // Images/youtube already drag via node view; handles are for text/quote/etc.
              if (node.isAtom || node.isLeaf || node.type.name === "layoutRow") {
                return;
              }
              decorations.push(
                Decoration.widget(
                  blockPos + 1,
                  () => {
                    const handle = document.createElement("button");
                    handle.type = "button";
                    handle.className = "editor-block-drag-handle";
                    handle.setAttribute("aria-label", "Drag block");
                    handle.contentEditable = "false";
                    handle.draggable = true;

                    handle.addEventListener("dragstart", (event) => {
                      const payload: DraggedBlockPayload = { pos: blockPos, kind: "block" };
                      try {
                        event.dataTransfer?.setData(BLOCK_DRAG_MIME, JSON.stringify(payload));
                        event.dataTransfer?.setData("text/plain", encodeBlockPayload(payload));
                        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
                      } catch {
                        // ignore
                      }
                      const tr = extension.editor.view.state.tr.setSelection(
                        NodeSelection.create(extension.editor.view.state.doc, blockPos)
                      );
                      extension.editor.view.dispatch(tr);
                    });

                    handle.addEventListener("mousedown", (event) => {
                      event.preventDefault();
                      const tr = extension.editor.view.state.tr.setSelection(
                        NodeSelection.create(extension.editor.view.state.doc, blockPos)
                      );
                      extension.editor.view.dispatch(tr);
                    });

                    return handle;
                  },
                  { side: -1, key: `drag-handle-${blockPos}` }
                )
              );
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),

      new Plugin({
        key: pluginKey,
        view(editorView) {
          disableNativeImageDrag(editorView.dom);
          return {
            update(view) {
              disableNativeImageDrag(view.dom);
            },
          };
        },
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              if (event.button !== 0) return false;
              if (
                event.target instanceof Element &&
                event.target.closest("[data-resize-handle], .editor-block-drag-handle")
              ) {
                return false;
              }
              const hit = findImageHit(view, event.clientX, event.clientY);
              if (!hit) return false;
              if (
                !(view.state.selection instanceof NodeSelection) ||
                view.state.selection.from !== hit.pos
              ) {
                view.dispatch(
                  view.state.tr.setSelection(NodeSelection.create(view.state.doc, hit.pos))
                );
              }
              return false;
            },

            dragstart(view, event) {
              if (
                event.target instanceof Element &&
                event.target.closest(".editor-block-drag-handle")
              ) {
                return false;
              }

              const hit = findImageHit(view, event.clientX, event.clientY);
              if (!hit) return false;
              const node = view.state.doc.nodeAt(hit.pos);
              if (!isImageNode(node)) return false;

              if (
                !(view.state.selection instanceof NodeSelection) ||
                view.state.selection.from !== hit.pos
              ) {
                view.dispatch(
                  view.state.tr.setSelection(NodeSelection.create(view.state.doc, hit.pos))
                );
              }

              // Prefer top-level image position for layout (not nested attrs-only payload).
              const $pos = view.state.doc.resolve(hit.pos);
              let blockPos = hit.pos;
              for (let d = $pos.depth; d > 0; d--) {
                if ($pos.node(d - 1).type.name === "doc") {
                  blockPos = $pos.before(d);
                  break;
                }
              }

              const imagePayload: DraggedImagePayload = {
                pos: blockPos,
                kind: "image",
                src: String(node.attrs.src ?? ""),
                alt: (node.attrs.alt as string | null) ?? null,
                title: (node.attrs.title as string | null) ?? null,
                width: typeof node.attrs.width === "number" ? node.attrs.width : null,
                height: typeof node.attrs.height === "number" ? node.attrs.height : null,
              };
              const blockPayload: DraggedBlockPayload = { pos: blockPos, kind: "block" };

              try {
                event.dataTransfer?.setData(DRAG_MIME, JSON.stringify(imagePayload));
                event.dataTransfer?.setData(BLOCK_DRAG_MIME, JSON.stringify(blockPayload));
                event.dataTransfer?.setData("text/plain", encodeBlockPayload(blockPayload));
                event.dataTransfer?.setData("text/uri-list", imagePayload.src);
                if (event.dataTransfer) event.dataTransfer.effectAllowed = "copyMove";
              } catch {
                // ignore
              }

              return false;
            },

            contextmenu(view, event) {
              const hit = findImageHit(view, event.clientX, event.clientY);
              if (!hit) return false;
              const node = view.state.doc.nodeAt(hit.pos);
              if (!isImageNode(node)) return false;

              event.preventDefault();
              event.stopPropagation();

              const menu: ImageMenuState = {
                open: true,
                x: event.clientX,
                y: event.clientY,
                pos: hit.pos,
                src: String(node.attrs.src ?? ""),
                alt: String(node.attrs.alt ?? ""),
                width: typeof node.attrs.width === "number" ? node.attrs.width : null,
                height: typeof node.attrs.height === "number" ? node.attrs.height : null,
                inRow: isImageInLayoutColumn(view, hit.pos),
              };

              extension.storage.menu = menu;
              extension.storage.onMenuChange?.(menu);
              return true;
            },

            dragover(view, event) {
              const types = event.dataTransfer?.types;
              const typeList = types ? Array.from(types as unknown as string[]) : [];
              const mayBeDrag =
                typeList.length === 0 ||
                typeList.includes("Files") ||
                typeList.includes(DRAG_MIME) ||
                typeList.includes(BLOCK_DRAG_MIME) ||
                typeList.includes("text/uri-list") ||
                typeList.includes("text/html") ||
                typeList.includes("text/plain");
              if (!mayBeDrag) return false;

              let excludePos: number | null = null;
              if (view.state.selection instanceof NodeSelection) {
                excludePos = view.state.selection.from;
              }

              const blockHit = findTopLevelBlockHit(view, event.clientX, event.clientY, excludePos);
              if (!blockHit || blockHit.node.type.name === "layoutRow") {
                clearHint(extension);
                return false;
              }

              event.preventDefault();
              if (event.dataTransfer) {
                event.dataTransfer.dropEffect = typeList.includes("Files") ? "copy" : "move";
              }

              setHint(extension, {
                pos: blockHit.pos,
                side: blockHit.side,
                rect: blockHit.rect,
              });
              return true;
            },

            dragleave(_view, event) {
              const related = event.relatedTarget as Node | null;
              const container = event.currentTarget as Element | null;
              if (related && container?.contains(related)) return false;
              clearHint(extension);
              return false;
            },

            click() {
              if (extension.storage.menu) {
                extension.storage.menu = null;
                extension.storage.onMenuChange?.(null);
              }
              return false;
            },
          },

          handleDrop(view, event, slice, moved) {
            const hint = extension.storage.dropHint;
            clearHint(extension);

            let excludePos: number | null = null;
            if (view.state.selection instanceof NodeSelection) {
              excludePos = view.state.selection.from;
            }

            const blockHit =
              (hint
                ? (() => {
                    const node = view.state.doc.nodeAt(hint.pos);
                    return node
                      ? { pos: hint.pos, side: hint.side, rect: hint.rect, node }
                      : null;
                  })()
                : null) ??
              findTopLevelBlockHit(view, event.clientX, event.clientY, excludePos) ??
              findTopLevelBlockHit(view, event.clientX, event.clientY);

            if (!blockHit || blockHit.node.type.name === "layoutRow") return false;

            const imageType = view.state.schema.nodes.image;

            // 1) Block drag (text, quote, heading, image, …)
            const blockPayload = getDraggedBlockPayload(event);
            if (blockPayload && blockPayload.pos !== blockHit.pos) {
              const sourceNode = view.state.doc.nodeAt(blockPayload.pos);
              if (sourceNode && sourceNode.type.name !== "layoutRow") {
                event.preventDefault();
                return placeBeside(
                  extension,
                  blockHit.pos,
                  blockHit.side,
                  sourceNode,
                  blockPayload.pos
                );
              }
            }

            // 2) Legacy image payload
            const imagePayload = getDraggedImagePayload(event);
            if (imagePayload?.src && imageType && imagePayload.pos !== blockHit.pos) {
              event.preventDefault();
              const incoming = imageType.create({
                src: imagePayload.src,
                alt: imagePayload.alt,
                title: imagePayload.title,
                width: imagePayload.width,
                height: imagePayload.height,
              });
              return placeBeside(
                extension,
                blockHit.pos,
                blockHit.side,
                incoming,
                imagePayload.pos
              );
            }

            // 3) ProseMirror-moved node
            if (moved) {
              const fromSlice = extractBlockFromSlice(slice);
              const fromSelection =
                view.state.selection instanceof NodeSelection ? view.state.selection.node : null;
              const incoming = fromSlice ?? fromSelection;
              const sourcePos =
                view.state.selection instanceof NodeSelection ? view.state.selection.from : null;

              if (
                incoming &&
                sourcePos != null &&
                sourcePos !== blockHit.pos &&
                incoming.type.name !== "layoutRow"
              ) {
                event.preventDefault();
                return placeBeside(extension, blockHit.pos, blockHit.side, incoming, sourcePos);
              }
            }

            // 4) External file onto a block → place image beside
            const files = event.dataTransfer?.files;
            const file = files?.length
              ? Array.from(files).find((f) => f.type.startsWith("image/"))
              : undefined;

            if (file && imageType) {
              event.preventDefault();
              void (async () => {
                const uploaded = await uploadImageFile(file);
                let src = uploaded?.url ?? null;
                let alt: string | null = uploaded?.alt ?? file.name;
                if (!src) src = await readFileAsDataUrl(file);
                if (!src) return;

                const still = view.state.doc.nodeAt(blockHit.pos);
                if (!still) {
                  extension.editor.chain().focus().setImage({ src, alt: alt ?? undefined }).run();
                  return;
                }

                const incoming = imageType.create({
                  src,
                  alt,
                  width: null,
                  height: null,
                });
                placeBeside(extension, blockHit.pos, blockHit.side, incoming);
              })();
              return true;
            }

            // 5) URL image drop
            const uri =
              event.dataTransfer
                ?.getData("text/uri-list")
                ?.split("\n")
                .find((l) => l && !l.startsWith("#")) ?? null;

            if (uri && imageType && /^(https?:|data:|\/)/i.test(uri)) {
              event.preventDefault();
              const incoming = imageType.create({
                src: uri,
                alt: null,
                width: null,
                height: null,
              });
              return placeBeside(extension, blockHit.pos, blockHit.side, incoming);
            }

            return false;
          },
        },
      }),
    ];
  },
});
