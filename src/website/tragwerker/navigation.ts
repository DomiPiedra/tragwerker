export type NavLink = { href: string; label: string };

export type NavGroup = { title: string; links: NavLink[] };

export const MAIN_NAV: NavLink[] = [
  { href: "/menschen", label: "Menschen" },
  { href: "/kompetenzen", label: "Kompetenzen" },
  { href: "/projekte", label: "Projekte" },
];

export const MENU_FOOTER_NAV: NavGroup[] = [
  {
    title: "Leistungen",
    links: [
      { href: "/tragwerksplanung", label: "Tragwerksplanung" },
      { href: "/pruefung", label: "Prüfung" },
    ],
  },
  {
    title: "Mehr",
    links: [
      { href: "/kontakt", label: "Kontakt" },
      { href: "/jobs", label: "Jobs" },
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
    ],
  },
];

export const SECONDARY_NAV: NavLink[] = MENU_FOOTER_NAV.flatMap((group) => group.links);

export const ALL_NAV = [...MAIN_NAV, ...SECONDARY_NAV];
