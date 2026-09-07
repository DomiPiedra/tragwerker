export type ProcessChapterBlock =
  | { type: "paragraphs"; paragraphs: string[] }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      /** full = edge-to-edge within container width; wide = max readable; pair = two images */
      layout?: "full" | "wide" | "pair";
      pairSrc?: string;
      pairAlt?: string;
      pairCaption?: string;
      objectClass?: string;
      pairObjectClass?: string;
    };

export type ProcessChapter = {
  id: string;
  number: string;
  title: string;
  blocks: ProcessChapterBlock[];
};

export type ProcessTeaser = {
  title: string;
  text: string;
  href: string;
  linkLabel: string;
};

export type KompetenzenPageContent = {
  title: string;
  headline: string;
  intro: string;
  chapters: ProcessChapter[];
  teasers: [ProcessTeaser, ProcessTeaser];
};
