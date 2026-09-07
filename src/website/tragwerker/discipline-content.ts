/** Shared editorial blocks for discipline pages (Snøhetta /disciplines style). */

export type EditorialBlock =
  | { type: "paragraphs"; paragraphs: string[] }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      layout?: "full" | "wide" | "pair";
      pairSrc?: string;
      pairAlt?: string;
      pairCaption?: string;
      objectClass?: string;
      pairObjectClass?: string;
    };

export type EditorialSection = {
  id: string;
  title: string;
  blocks: EditorialBlock[];
};

export type DisciplineTeaser = {
  title: string;
  text: string;
  href: string;
  linkLabel: string;
};

export type DisciplinePageContent = {
  title: string;
  breadcrumbLabel: string;
  statement: string;
  lead: string[];
  sections: EditorialSection[];
  projectsTitle: string;
  projectsLinkLabel: string;
  closing?: EditorialSection;
  teasers: [DisciplineTeaser, DisciplineTeaser];
};
