import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import type { DisciplinePageContent } from "@/website/tragwerker/discipline-content";
import { SITE_IMAGES } from "@/website/tragwerker/images";

/**
 * Tragwerksplanung as a Snøhetta-style discipline page —
 * narrative sections + selected projects, Tragwerker content.
 */
export const defaultTragwerksplanungPage: DisciplinePageContent = {
  title: "Tragwerksplanung",
  breadcrumbLabel: "Leistungen",
  statement: "Tragwerksplanung — Von der Vorbemessung bis zur Ausführung.",
  lead: [
    "Wir entwickeln das statische System, dimensionieren Querschnitte und Verbindungen und koordinieren die Konstruktion mit Architektur und Fachplanung – von der Vorbemessung bis zur Ausführungsplanung.",
    "Ein gutes Tragwerk schafft Möglichkeiten: stützenfreie Räume, große Spannweiten, schlanke Konstruktionen, flexible Grundrisse. Es beeinflusst, wie ein Gebäude sich anfühlt — nicht nur, ob es steht. Fassaden, Nutzungsmöglichkeiten, das Verhältnis von Innen- zu Außenraum: all das hängt am Tragwerk.",
    "Wir planen Tragwerke für Neubauten sowie für Umbauten und Sanierungen im Bestand. Seit der Gründung des Büros haben wir über 1.400 Bauvorhaben geplant und mehr als 2.200 Bauvorhaben baustatisch geprüft.",
  ],
  sections: [
    {
      id: "grundlage",
      title: "Tragwerk als positive Kraft",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Tragwerksplanung ist die unsichtbare Grundlage jedes Bauwerks. Sie bestimmt, ob Entwürfe tragfähig, wirtschaftlich und dauerhaft sind — und ob Architektur den Raum bekommt, den sie braucht.",
            "Wir arbeiten eng mit Architekturbüros, Bauherren und Fachplanern zusammen. Frühe Variantenstudien zu Statik, Materialwahl und Wirtschaftlichkeit geben dem Entwurf eine belastbare konstruktive Grundlage — bevor Entscheidungen schwer revidierbar sind.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.stahlbeton3,
          alt: "Tragwerksplanung",
          caption: "Konstruktive Klarheit vom ersten Konzept an",
          layout: "pair",
          pairSrc: SITE_IMAGES.bauenImBestand2,
          pairAlt: "Struktur und Bestand",
          pairCaption: "Raum für Architektur — getragen von Struktur",
        },
        {
          type: "paragraphs",
          paragraphs: [
            "Dabei denken wir über den Fertigstellungsmoment hinaus: Nutzungsänderungen, Ertüchtigungen und den Lebenszyklus des Bauwerks. Gute Tragwerksplanung schafft Reserven, wo sie sinnvoll sind — und vermeidet Material, wo es keine Funktion erfüllt.",
          ],
        },
      ],
    },
    {
      id: "massstaebe",
      title: "Alle Maßstäbe und Phasen",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Wir arbeiten über den gesamten Planungsprozess: In LP 1–2 entwickeln wir Tragwerkskonzepte und Vorbemessungen und stimmen das statische System früh mit dem Architekturentwurf ab.",
            "In LP 3–5 folgen Entwurf, statische Berechnung und der normkonforme Standsicherheitsnachweis — inklusive der Unterlagen für die Baugenehmigung und laufender Einarbeitung von Entwurfsänderungen.",
            "In LP 6–8 liefern wir die konstruktiven Ausführungsunterlagen: Bewehrungs-, Schalungs- und Montagepläne, Holzbaudetails. Auf der Baustelle stehen wir für technische Rückfragen bereit und begleiten die konstruktive Qualitätssicherung.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.bauueberwachung,
          alt: "Planung und Ausführung",
          caption: "Von der Vorbemessung bis zur Baustelle",
          layout: "pair",
          pairSrc: SITE_IMAGES.stahlbau,
          pairAlt: "Ingenieurbau",
          pairCaption: "Projekte jeder Größenordnung",
          pairObjectClass: "object-[center_30%]",
        },
        {
          type: "paragraphs",
          paragraphs: [
            "Ob kleines Umbauvorhaben oder große Infrastruktur: Maßstab und Typologie wechseln, die Methode bleibt — analytische Präzision, materialgerechtes Denken und klare Schnittstellen zu allen Fachdisziplinen.",
          ],
        },
      ],
    },
  ],
  projectsTitle: "Ausgewählte Projekte",
  projectsLinkLabel: "→ Alle Projekte",
  closing: {
    id: "verantwortlich",
    title: "Verantwortungsvolle Planung",
    blocks: [
      {
        type: "paragraphs",
        paragraphs: [
          "Was Sie erhalten, ist prüffähig und ausführungsreif: Standsicherheitsnachweis, konstruktive Ausführungsunterlagen, Koordination mit Architektur und TGA sowie Baustellenbegleitung.",
          "Jedes Projekt ist Ausdruck seines Ortes und seiner Nutzer. Wir untersuchen Lastannahmen, Geometrie und Randbedingungen sorgfältig — und entwickeln Lösungen, die Sicherheit, Wirtschaftlichkeit und Dauerhaftigkeit verbinden.",
          "So entsteht Tragwerksplanung, die Entwurf und Ausführung zusammenhält: von der ersten Vorbemessung bis zur letzten Detailklärung auf der Baustelle.",
        ],
      },
      {
        type: "image",
        src: SITE_IMAGES.stahlbeton3,
        alt: "Präzise Nachweise und Ausführungsplanung",
        caption: "Nachweis, Koordination, Qualitätssicherung",
        layout: "wide",
      },
    ],
  },
  teasers: [
    {
      title: "Kompetenzen",
      text: "Konstruktive Erfahrung. Technische Tiefe. Präzise Planung.",
      href: "/kompetenzen",
      linkLabel: "Mehr erfahren",
    },
    {
      title: "Kontakt",
      text: "Leistungsumfang, Schnittstellen und Termine klären wir am besten früh — idealerweise bereits im Vorentwurf.",
      href: `mailto:${SITE_CONTACT_EMAIL}`,
      linkLabel: "Kontakt aufnehmen",
    },
  ],
};
