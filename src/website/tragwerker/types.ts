export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type ExpertiseItem = {
  number: string;
  title: string;
  description: string;
};

export type ServiceSections = {
  intro?: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    imageUrl?: string;
    imagePosition?: "left" | "right";
  };
  process?: {
    eyebrow: string;
    title: string;
    steps: ProcessStep[];
  };
  expertise?: {
    eyebrow: string;
    title: string;
    items: ExpertiseItem[];
  };
  deliverables?: {
    eyebrow: string;
    items: Array<{ title: string; bullets: string[] }>;
  };
  pruefleistungen?: {
    eyebrow: string;
    title: string;
    items: ExpertiseItem[];
  };
  featuredProject?: boolean;
};

export type HomeStat = {
  value: string;
  label: string;
  inverted?: boolean;
};

export type HomepageContent = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    imageUrl: string;
  };
  stats: HomeStat[];
  philosophy: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    focusAreas: string[];
    imageUrls?: [string, string];
  };
  highlights?: Array<{
    title: string;
    paragraphs: string[];
    href: string;
    imageUrl: string;
  }>;
  process: {
    eyebrow: string;
    title: string;
    steps: ProcessStep[];
  };
  contact: {
    headline: string;
    text: string;
  };
};

export type PageSections = {
  hero?: { eyebrow?: string; title: string; headline?: string; intro?: string; imageUrl?: string };
  sections?: Array<{
    eyebrow?: string;
    title: string;
    body?: string;
    paragraphs?: string[];
    items?: ExpertiseItem[];
    steps?: ProcessStep[];
  }>;
  cta?: { headline: string; text: string; buttonLabel: string; mailto: string };
};
