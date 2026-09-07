import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import type { HomepageContent, PageSections, ServiceSections } from "@/website/tragwerker/types";

export const defaultHomepage: HomepageContent = {
  hero: {
    eyebrow: "001 — INGENIEURBÜRO FÜR TRAGWERKSPLANUNG",
    headline: "Drei Generationen Tragwerksplanung. Erfahrung, die trägt.",
    subheadline: "Tragwerksplanung für Bauwerke, die dauerhaft funktionieren.",
    imageUrl: SITE_IMAGES.heroHome,
  },
  stats: [
    { value: "Germering,\nbei München", label: "Standort" },
    { value: "1959", label: "gegründet" },
    { value: "1.400+", label: "Projekte in der Tragwerksplanung" },
    { value: "2.200+", label: "Projekte in der baustatischen Prüfung" },
  ],
  philosophy: {
    eyebrow: "004 — KONSTRUKTIVE HALTUNG",
    title: "Über 66 Jahre konstruktive Erfahrung. Jedes Projekt neu gedacht.",
    paragraphs: [
      "Seit über 67 Jahren entwickeln wir Tragwerke mit konstruktiver Klarheit, technischem Verständnis und dem Blick für wirtschaftliche und sichere Lösungen. Dabei entstehen präzise geplante Konstruktionen, die sich durch Dauerhaftigkeit, Wirtschaftlichkeit und Praxistauglichkeit auszeichnen.",
      "Grundlage unserer Arbeit ist die enge Zusammenarbeit mit Architekten, Bauherren und Projektpartnern. Durch klare Kommunikation, sorgfältige Planung und langjährige Erfahrung schaffen wir Tragwerke, die technisch überzeugen und sich dauerhaft bewähren.",
      "Seit 1959 stehen bei uns Dauerhaftigkeit, Verlässlichkeit und technisches Können im Mittelpunkt – heute in der dritten Generation. Aus dieser Erfahrung entstehen Tragwerke, die strukturell klar aufgebaut, normkonform nachgewiesen und über Jahrzehnte praxistauglich sind.",
      "Die Grundlage dafür ist ein integraler Planungsansatz: Wir arbeiten eng mit Architekten, Bauherren und Fachplanern zusammen und stimmen statisches System, Materialwahl und konstruktive Details frühzeitig aufeinander ab.",
    ],
    focusAreas: [
      "Neubauten",
      "Umbauten, Erweiterungen und Sanierungen im Bestand",
      "Wohnungs-, Gewerbe- und Verwaltungsbau",
      "Schulen, Sporthallen, Krankenhäuser und öffentliche Einrichtungen",
      "Industrie- und Hallenbau",
      "Stahlbeton- und Mauerwerksbau",
      "Holzbau und Holzhybridbau",
      "Stahl- und Verbundkonstruktionen",
      "Nachhaltige Bauweisen",
      "Baustatische Prüfung",
      "Massivbau",
      "Holz-Hybrid",
      "Stahlbau",
      "Bestandsertüchtigung",
      "Gründung",
    ],
    imageUrls: [SITE_IMAGES.homePhilosophy1, SITE_IMAGES.homePhilosophy2],
  },
  highlights: [
    {
      title: "Tragwerksplanung",
      paragraphs: [
        "Tragwerksplanung ist die unsichtbare Grundlage jedes Bauwerks. Sie bestimmt, ob Entwürfe tragfähig, wirtschaftlich und dauerhaft sind.",
        "Wir arbeiten eng mit Architekturbüros, Bauherren und Fachplanern zusammen — präzise, materialgerecht und mit Blick auf langfristige Belastbarkeit.",
      ],
      href: "/tragwerksplanung",
      imageUrl: SITE_IMAGES.homeTragwerksplanung,
    },
    {
      title: "Kompetenzen",
      paragraphs: [
        "Die Tragwerker entwickeln statische Konzepte, die Sicherheit, Wirtschaftlichkeit und Dauerhaftigkeit vereinen — vom Massivbau bis zum Sondertragwerk.",
        "Unsere Schwerpunkte reichen von Holz- und Verbundkonstruktionen über Bestandsanalysen bis zu Brücken und Sonderbauten.",
      ],
      href: "/kompetenzen",
      imageUrl: SITE_IMAGES.homeKompetenzen,
    },
  ],
  process: {
    eyebrow: "005 — METHODIK",
    title: "Strukturierte Tragwerksplanung von der ersten Idee bis zur Ausführung",
    steps: [
      {
        number: "01",
        title: "Analyse",
        description:
          "Wir analysieren die Anforderungen des Bauvorhabens, die konstruktiven Randbedingungen und das statische System als Grundlage für eine wirtschaftliche und sichere Tragwerksplanung.",
      },
      {
        number: "02",
        title: "Konzept",
        description:
          "Wir entwickeln durchdachte Tragwerkskonzepte und stimmen Konstruktion, Materialwahl und statisches System frühzeitig mit Architekten und Fachplanern ab.",
      },
      {
        number: "03",
        title: "Planung",
        description:
          "Wir erstellen präzise statische Berechnungen, Detailplanungen und konstruktive Ausführungsunterlagen. Die Koordination mit allen Fachplanern ist dabei selbstverständlicher Bestandteil unserer Arbeit.",
      },
      {
        number: "04",
        title: "Umsetzung",
        description:
          "Während der Ausführung begleiten wir das Projekt mit technischer Abstimmung, konstruktiver Klarheit und sorgfältiger Qualitätssicherung.",
      },
    ],
  },
  contact: {
    headline: "Lassen Sie uns sprechen.",
    text: "Für Anfragen, Kooperationen oder einen fachlichen Austausch.",
  },
};

export const defaultKompetenzen: PageSections = {
  hero: {
    title: "Kompetenzen",
    headline:
      "Die Tragwerker entwickeln statische Konzepte, die Sicherheit, Wirtschaftlichkeit und Dauerhaftigkeit vereinen.",
    imageUrl: SITE_IMAGES.heroKompetenzen,
  },
  sections: [
    {
      eyebrow: "Ansatz",
      title: "Systematisch denken, präzise planen, dauerhaft bauen",
      paragraphs: [
        "Unsere Arbeit beginnt mit einer präzisen Analyse der Anforderungen und endet erst, wenn das Tragwerk technisch, konstruktiv und wirtschaftlich überzeugt.",
        "Wir denken Projekte integrativ — im engen Austausch mit Architektur, Fachplanung und Bauherrschaft.",
      ],
    },
    {
      eyebrow: "Expertise",
      title: "Schwerpunkte",
      items: [
        {
          number: "01",
          title: "Massivbau",
          description:
            "Stahlbeton- und Spannbetonkonstruktionen für Hoch- und Ingenieurbau. Großspannweiten und Sonderkonstruktionen.",
        },
        {
          number: "02",
          title: "Stahlbau",
          description: "Stahl- und Verbundkonstruktionen, Brückenbau, Industrieanlagen. Schwingungsanalysen.",
        },
        {
          number: "03",
          title: "Holzbau",
          description: "Brettschichtholz, Brettsperrholz, Holz-Hybrid-Bauweise. Mehrgeschossiger Holzbau.",
        },
        {
          number: "04",
          title: "Brückenbau",
          description: "Straßen- und Eisenbahnbrücken. Neubau, Ertüchtigung und Monitoring.",
        },
        {
          number: "05",
          title: "Bestand",
          description: "Analyse und Verstärkung bestehender Tragwerke. Umnutzung und denkmalgerechte Sanierung.",
        },
        {
          number: "06",
          title: "Sonderkonstruktionen",
          description: "Tribünen, Freilichtbühnen, temporäre Bauten und Veranstaltungstechnik.",
        },
      ],
    },
  ],
  cta: {
    headline: "Sprechen Sie mit uns über Ihr Projekt",
    text: "Wir beraten Sie gerne — unverbindlich und kompetent.",
    buttonLabel: "Projekt anfragen",
    mailto: SITE_CONTACT_EMAIL,
  },
};

export const defaultTragwerksplanung: ServiceSections = {
  intro: {
    eyebrow: "Was wir leisten",
    title: "Was wir leisten",
    paragraphs: [
      "Wir übernehmen die vollständige Tragwerksplanung nach HOAI – von der ersten Vorbemessung im Vorentwurf bis zu den konstruktiven Ausführungsunterlagen und der Begleitung auf der Baustelle. Der Leistungsumfang wird projektspezifisch vereinbart; häufig werden einzelne Phasen oder Teilleistungen beauftragt.",
      "Grundlage jeder Beauftragung ist eine klare Klärung des Leistungsumfangs, der Schnittstellen zur Architektur und zu anderen Fachplanern sowie der projektbezogenen Anforderungen an Bauweise, Terminplanung und Genehmigung.",
    ],
  },
  process: {
    eyebrow: "Leistungsphasen",
    title: "Prozess",
    steps: [
      {
        number: "LP 1–2",
        title: "Vorentwurf und Vorbemessung",
        description:
          "Wir entwickeln erste Tragwerkskonzepte, bewerten Varianten hinsichtlich Statik, Materialwahl und Wirtschaftlichkeit und stimmen das statische System frühzeitig mit dem Architekturentwurf ab. Vorbemessungen geben dem Entwurf eine belastbare konstruktive Grundlage – bevor Entscheidungen schwer revidierbar sind.",
      },
      {
        number: "LP 3–5",
        title: "Entwurf, Nachweis und Genehmigung",
        description:
          "Ausarbeitung des Tragwerkskonzepts, statische Berechnung und normkonformer Standsicherheitsnachweis. Wir erstellen alle für die Baugenehmigung erforderlichen Unterlagen und koordinieren die konstruktiven Details mit allen beteiligten Fachplanern. Änderungen im Entwurf werden laufend eingearbeitet und bewertet.",
      },
      {
        number: "LP 6–8",
        title: "Ausführungsplanung und Baubegleitung",
        description:
          "Vollständige konstruktive Ausführungsunterlagen: Bewehrungspläne, Schalungspläne, Montagepläne, Holzbaudetails. Auf der Baustelle stehen wir für technische Rückfragen zur Verfügung, prüfen Ausführungsabweichungen und begleiten die konstruktive Qualitätssicherung.",
      },
    ],
  },
  deliverables: {
    eyebrow: "Was Sie erhalten",
    items: [
      {
        title: "Standsicherheitsnachweis",
        bullets: [
          "Statische Berechnung",
          "Normkonformer Nachweis",
          "Prüffähige Unterlagen",
          "Behördliche Einreichung",
        ],
      },
      {
        title: "Ausführungsunterlagen",
        bullets: [
          "Bewehrungs- und Schalungspläne",
          "Montagepläne Stahl / Holz",
          "Konstruktive Details",
          "Positionspläne",
        ],
      },
      {
        title: "Koordination",
        bullets: [
          "Abstimmung mit Architektur",
          "Schnittstellenklärung TGA",
          "Fachplaner-Koordination",
          "BIM-gestützte Übergabe",
        ],
      },
      {
        title: "Baustellenbegleitung",
        bullets: [
          "Technische Rückfragen",
          "Abweichungsbewertung",
          "Konstruktive Kontrolle",
          "Dokumentation",
        ],
      },
    ],
  },
  featuredProject: true,
};

export const defaultPruefung: ServiceSections = {
  intro: {
    eyebrow: "Unabhängigkeit",
    title: "Technische Verantwortung und Qualitätssicherung",
    paragraphs: [
      "Wir prüfen statische Berechnungen, Tragwerkskonzepte und konstruktive Details unabhängig und normkonform – als technische Qualitätssicherung für Bauherren, Architekten und Behörden.",
      "Das Ingenieurbüro Dr. Rausch übernimmt die unabhängige Prüfung von Standsicherheitsnachweisen mit bauaufsichtlicher Anerkennung und langjähriger Erfahrung in der baustatischen Prüfung. Die Prüfung erfolgt dabei stets unabhängig und grundsätzlich getrennt von der Planung.",
      "Prüfung bedeutet, Tragwerke dauerhaft sicher und konstruktiv nachvollziehbar zu machen.",
    ],
    imageUrl: SITE_IMAGES.abnahme,
    imagePosition: "right",
  },
  pruefleistungen: {
    eyebrow: "Leistungen",
    title: "Prüfleistungen",
    items: [
      {
        number: "01",
        title: "Statische Berechnungen",
        description: "Prüfung statischer Berechnungen, Tragwerkskonzepte und Normenkonformität.",
      },
      {
        number: "02",
        title: "Ausführungsplanung",
        description: "Prüfung der Ausführungsplanung und konstruktiver Details.",
      },
      {
        number: "03",
        title: "Tragwerkskonzepte",
        description: "Unabhängige Bewertung von Tragwerkskonzepten — von der Idee bis zur Umsetzung.",
      },
      {
        number: "04",
        title: "Ausführung",
        description: "Qualitätssicherung auf der Baustelle als vollständiger Blick auf das Tragwerk.",
      },
    ],
  },
  process: {
    eyebrow: "Ablauf",
    title: "Prüfprozess",
    steps: [
      {
        number: "01",
        title: "Unterlagenprüfung",
        description: "Prüfung auf Vollständigkeit. Erste Sichtung innerhalb von drei Werktagen.",
      },
      {
        number: "02",
        title: "Technische Prüfung",
        description: "Detaillierte Nachrechnung. Regelbearbeitungszeit: zwei bis drei Wochen.",
      },
      {
        number: "03",
        title: "Prüfbericht",
        description: "Erstellung des Prüfberichts mit Feststellungen und ggf. Auflagen.",
      },
      {
        number: "04",
        title: "Bescheinigung",
        description: "Ausstellung der Prüfbescheinigung nach erfolgreicher Prüfung.",
      },
    ],
  },
  expertise: {
    eyebrow: "Expertise",
    title: "Prüfbereiche",
    items: [
      { number: "01", title: "Massivbau", description: "Stahlbeton, Spannbeton, Mauerwerk nach DIN EN 1992, 1996." },
      { number: "02", title: "Stahlbau", description: "Stahl- und Verbundkonstruktionen nach DIN EN 1993, 1994." },
      { number: "03", title: "Holzbau", description: "Holz- und Holzverbundkonstruktionen nach DIN EN 1995." },
      { number: "04", title: "Geotechnik", description: "Gründungen, Böschungen, Stützbauwerke nach DIN 1054, 4085." },
    ],
  },
};
