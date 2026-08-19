import { mergeAttributes, Node } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode, type Schema } from "@tiptap/pm/model";

export type LayoutRowOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export type LayoutColumnOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    layoutRow: {
      /** Place a block node beside another top-level block. */
      placeBlockBeside: (input: {
        targetPos: number;
        side: "left" | "right";
        incoming: ProseMirrorNode;
        sourcePos?: number | null;
      }) => ReturnType;
      /** Insert a new image beside the block at targetPos (file / URL drop). */
      placeImageBeside: (input: {
        anchorPos: number;
        side: "left" | "right";
        src: string;
        alt?: string | null;
      }) => ReturnType;
      unwrapLayoutRow: (pos: number) => ReturnType;
      insertEmptyColumns: () => ReturnType;
      /** @deprecated alias */
      unwrapImageRow: (pos: number) => ReturnType;
    };
  }
}

const COLUMN_CONTENT =
  "(paragraph | heading | blockquote | bulletList | orderedList | codeBlock | horizontalRule | image | youtube | editorVideo)+";

function cloneNode(node: ProseMirrorNode): ProseMirrorNode {
  return node.type.create(node.attrs, node.content, node.marks);
}

function wrapInColumn(schema: Schema, node: ProseMirrorNode): ProseMirrorNode | null {
  const columnType = schema.nodes.layoutColumn;
  if (!columnType) return null;
  if (node.type.name === "layoutColumn") return cloneNode(node);
  if (node.type.name === "layoutRow") return null;
  return columnType.create(null, cloneNode(node));
}

function buildLayoutRow(
  schema: Schema,
  left: ProseMirrorNode,
  right: ProseMirrorNode
): ProseMirrorNode | null {
  const rowType = schema.nodes.layoutRow;
  const leftCol = wrapInColumn(schema, left);
  const rightCol = wrapInColumn(schema, right);
  if (!rowType || !leftCol || !rightCol) return null;
  return rowType.create(null, [leftCol, rightCol]);
}

function parseLegacyImageRowContent(dom: HTMLElement, schema: Schema): Fragment {
  const imageType = schema.nodes.image;
  const columnType = schema.nodes.layoutColumn;
  if (!imageType || !columnType) return Fragment.empty;

  const columns: ProseMirrorNode[] = [];

  const pushImage = (img: HTMLImageElement) => {
    const src = img.getAttribute("src");
    if (!src) return;
    const image = imageType.create({
      src,
      alt: img.getAttribute("alt"),
      title: img.getAttribute("title"),
      width: img.width || null,
      height: img.height || null,
    });
    columns.push(columnType.create(null, image));
  };

  for (const child of Array.from(dom.children)) {
    if (child instanceof HTMLImageElement) {
      pushImage(child);
      continue;
    }
    const img = child.querySelector("img");
    if (img) pushImage(img);
  }

  while (columns.length < 2) {
    const paragraph = schema.nodes.paragraph?.create();
    if (!paragraph) break;
    columns.push(columnType.create(null, paragraph));
  }

  return Fragment.from(columns.slice(0, 2));
}

export const LayoutColumn = Node.create<LayoutColumnOptions>({
  name: "layoutColumn",
  content: COLUMN_CONTENT,
  isolating: true,
  defining: true,
  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "editor-layout-column",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "layout-column",
      }),
      0,
    ];
  },
});

export const LayoutRow = Node.create<LayoutRowOptions>({
  name: "layoutRow",
  group: "block",
  content: "layoutColumn{2}",
  isolating: true,
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "editor-layout-row",
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="layout-row"]' },
      {
        tag: 'div[data-type="image-row"]',
        getContent: (dom, schema) => parseLegacyImageRowContent(dom as HTMLElement, schema),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "layout-row",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      placeBlockBeside:
        ({ targetPos, side, incoming, sourcePos }) =>
        ({ state, tr, dispatch }) => {
          const target = state.doc.nodeAt(targetPos);
          if (!target || target.type.name === "layoutRow") return false;

          const $target = state.doc.resolve(targetPos);
          if ($target.parent.type.name === "layoutColumn") {
            const colPos = $target.before($target.depth);
            const col = $target.parent;
            const nextCol = wrapInColumn(state.schema, incoming);
            if (!nextCol) return false;
            let next = tr.replaceWith(colPos, colPos + col.nodeSize, nextCol);
            if (sourcePos != null && sourcePos !== targetPos) {
              const mapped = next.mapping.map(sourcePos);
              const srcNode = next.doc.nodeAt(mapped);
              if (srcNode) next = next.delete(mapped, mapped + srcNode.nodeSize);
            }
            if (dispatch) dispatch(next.scrollIntoView());
            return true;
          }

          if ($target.parent.type.name !== "doc") return false;

          const row = buildLayoutRow(
            state.schema,
            side === "left" ? incoming : target,
            side === "left" ? target : incoming
          );
          if (!row) return false;

          let next = tr;
          if (sourcePos != null && sourcePos !== targetPos) {
            if (sourcePos < targetPos) {
              const srcNode = state.doc.nodeAt(sourcePos);
              if (!srcNode) return false;
              next = next.delete(sourcePos, sourcePos + srcNode.nodeSize);
              const mappedTarget = next.mapping.map(targetPos);
              const mappedNode = next.doc.nodeAt(mappedTarget);
              if (!mappedNode) return false;
              next = next.replaceWith(mappedTarget, mappedTarget + mappedNode.nodeSize, row);
            } else {
              next = next.replaceWith(targetPos, targetPos + target.nodeSize, row);
              const mappedSource = next.mapping.map(sourcePos);
              const srcNode = next.doc.nodeAt(mappedSource);
              if (srcNode) next = next.delete(mappedSource, mappedSource + srcNode.nodeSize);
            }
          } else {
            next = next.replaceWith(targetPos, targetPos + target.nodeSize, row);
          }

          if (dispatch) dispatch(next.scrollIntoView());
          return true;
        },

      placeImageBeside:
        ({ anchorPos, side, src, alt }) =>
        ({ state, tr, dispatch }) => {
          const imageType = state.schema.nodes.image;
          if (!imageType) return false;
          const incoming = imageType.create({
            src,
            alt: alt ?? null,
            width: null,
            height: null,
          });
          const target = state.doc.nodeAt(anchorPos);
          if (!target || target.type.name === "layoutRow") return false;
          const $target = state.doc.resolve(anchorPos);
          if ($target.parent.type.name !== "doc") return false;

          const row = buildLayoutRow(
            state.schema,
            side === "left" ? incoming : target,
            side === "left" ? target : incoming
          );
          if (!row) return false;
          tr.replaceWith(anchorPos, anchorPos + target.nodeSize, row);
          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },

      unwrapLayoutRow:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== "layoutRow") return false;
          const blocks: ProseMirrorNode[] = [];
          node.forEach((col) => {
            col.forEach((child) => {
              blocks.push(cloneNode(child));
            });
          });
          tr.replaceWith(pos, pos + node.nodeSize, Fragment.from(blocks));
          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },

      unwrapImageRow:
        (pos) =>
        ({ commands }) =>
          commands.unwrapLayoutRow(pos),

      insertEmptyColumns:
        () =>
        ({ state, tr, dispatch }) => {
          const rowType = state.schema.nodes.layoutRow;
          const colType = state.schema.nodes.layoutColumn;
          const paragraph = state.schema.nodes.paragraph;
          if (!rowType || !colType || !paragraph) return false;
          const row = rowType.create(null, [
            colType.create(null, paragraph.create()),
            colType.create(null, paragraph.create()),
          ]);
          if (dispatch) {
            tr.replaceSelectionWith(row).scrollIntoView();
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

/** @deprecated Use LayoutRow */
export const ImageRow = LayoutRow;
