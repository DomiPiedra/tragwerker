export const SITE_NAME = "Die Tragwerker";
export const SITE_HEADER_NAME = "Die Tragwerker GmbH";
export const SITE_SHORT_NAME = "Tragwerker";
export const SITE_TAGLINE =
  "Ingenieurkunst für München und darüber hinaus — Tragwerke, die bleiben.";
export const SITE_CONTACT_EMAIL = "office@tragwerker.de";
export const SITE_PHONE = "+49 89 3066 881-0";
export const SITE_FAX = "+49 89 3066 881-29";
export const SITE_ADDRESS = "Die Tragwerker GmbH\nSüdendstraße 60\n82110 Germering";

export const SITE_LEGAL = {
  companyName: "Die Tragwerker GmbH",
  street: "Südendstraße 60",
  zipCity: "82110 Germering",
  managingDirectors: [
    "Dr.-Ing. Niclas Rausch",
    "Dipl.-Ing. (FH) Michael Knittler",
  ],
  phone: SITE_PHONE,
  fax: SITE_FAX,
  email: SITE_CONTACT_EMAIL,
  registerCourt: "Amtsgericht München",
  registerNumber: "HRB 222651",
  vatId: "DE305756730",
  chamber: {
    name: "Bayerische Ingenieurekammer-Bau (BYIK)",
    membershipNumber: "11321",
    address: "Schloßschmidstraße 3\n80639 München",
    url: "https://bayika.de/",
  },
  profession: {
    title: "Bauingenieur",
    regulations:
      "Gesetz über die Bayerische Architektenkammer und die Bayerische Ingenieurekammer-Bau (Baukammerngesetz – BauKaG) vom 9. Mai 2007",
    regulationsUrl: "https://gesetze-bayern.de/Content/Document/BayBauKaG",
  },
  insurance: {
    name: "HDI Versicherung AG",
    address: "Buchholzer Str. 98\n30655 Hannover",
    scope: "Deutschland",
  },
  contentResponsible: "Dipl.-Ing. (FH) Michael Knittler",
} as const;

export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3003")
  );
}

export function absoluteUrl(path: string): string {
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
