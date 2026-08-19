import { mergeAttributes, Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editorVideo: {
      setEditorVideo: (attrs: { src: string; title?: string | null }) => ReturnType;
    };
  }
}

export const EditorVideo = Node.create({
  name: "editorVideo",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      controls: { default: true },
      playsinline: { default: true },
      preload: { default: "metadata" },
    };
  },

  parseHTML() {
    return [{ tag: 'video[data-editor-video="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        "data-editor-video": "true",
        controls: "true",
        playsinline: "true",
        preload: "metadata",
        class: "my-4 w-full rounded-lg",
      }),
    ];
  },

  addCommands() {
    return {
      setEditorVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src,
              title: attrs.title ?? null,
              controls: true,
              playsinline: true,
              preload: "metadata",
            },
          }),
    };
  },
});
