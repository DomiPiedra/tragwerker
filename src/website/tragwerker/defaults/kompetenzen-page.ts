import { SITE_IMAGES } from "@/website/tragwerker/images";
import type { KompetenzenPageContent } from "@/website/tragwerker/kompetenzen-content";

export const defaultKompetenzenPage: KompetenzenPageContent = {
  title: "KOMPETENZEN",
  headline: "Konstruktive Erfahrung. Technische Tiefe. Präzise Planung.",
  intro:
    "Statische Konzepte, die Sicherheit, Wirtschaftlichkeit und Dauerhaftigkeit vereinen.",
  chapters: [
    {
      id: "ansatz",
      number: "1",
      title: "Systematisch denken, präzise planen, dauerhaft bauen",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Unsere Arbeit beginnt mit einer präzisen Analyse der Anforderungen und endet erst, wenn das Tragwerk technisch, konstruktiv und wirtschaftlich überzeugt.",
            "Wir denken Projekte integrativ – im engen Austausch mit Architektur, Fachplanung und Bauherrschaft. Dabei verbinden wir konstruktive Erfahrung mit digitaler Planung und einem klaren Verständnis für Material, Detail und Ausführung.",
            "So entstehen Tragwerke, die logisch aufgebaut, ressourcenschonend dimensioniert und langfristig belastbar sind.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.stahlbeton1,
          alt: "Stahlbetontragwerk auf der Baustelle",
          layout: "wide",
        },
      ],
    },
    {
      id: "tiefe",
      number: "2",
      title: "Tragwerksplanung mit technischer Tiefe und konstruktiver Erfahrung",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Wir planen Tragwerke für Neubauten sowie für Umbauten und Sanierungen im Bestand. Seit der Gründung des Büros haben wir über 1.400 Bauvorhaben geplant und mehr als 2.200 Bauvorhaben baustatisch geprüft. Unsere Arbeit umfasst Wohnungsbau, öffentliche Bauvorhaben, Gewerbe- und Verwaltungsbauten ebenso wie Industrie- und Hallenbau. Je nach Bauaufgabe entwickeln wir wirtschaftliche Tragwerke in Stahlbeton-, Holz-, Stahl- oder Hybridbauweise und stimmen Konstruktion und Materialwahl präzise auf Architektur, Nutzung und Ausführung ab.",
          ],
        },
      ],
    },
    {
      id: "bestand",
      number: "3",
      title: "Neubauten und Bestand",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Wir planen Tragwerke für neue Gebäude ebenso wie für Umbauten, Erweiterungen und Sanierungen im Bestand. Bestehende Konstruktionen, Nutzungsanforderungen und wirtschaftliche Randbedingungen werden dabei von Beginn an berücksichtigt. Insbesondere Eingriffe in bestehende Tragstrukturen, Ertüchtigungsmaßnahmen und konstruktive Verstärkungen erfordern präzise Planung und konstruktive Erfahrung.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.bauenImBestand1,
          alt: "Bauen im Bestand",
          layout: "pair",
          pairSrc: SITE_IMAGES.bauenImBestand2,
          pairAlt: "Holztragwerk im Bestand",
        },
      ],
    },
    {
      id: "typologien",
      number: "4",
      title: "Wohnungs-, Gewerbe- und öffentliche Bauvorhaben",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Unsere Projekte reichen vom privaten Wohnungsbau bis zu Schulen, Sporthallen, Krankenhäusern, Verwaltungsgebäuden und gewerblichen Nutzungen mit komplexen Anforderungen an Konstruktion und Ausführung. Langjährige Erfahrung mit öffentlichen Auftraggebern, Landkreisen und Kommunen prägt dabei unsere Arbeit ebenso wie die Anforderungen komplexer öffentlicher Bauvorhaben.",
          ],
        },
      ],
    },
    {
      id: "bauweisen",
      number: "5",
      title: "Stahlbeton-, Holz-, Stahl- und Hybridbau",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Je nach Bauaufgabe entwickeln wir konstruktiv und wirtschaftlich abgestimmte Tragwerke in unterschiedlichen Bauweisen und Materialien. Konstruktion, Materialeinsatz und Ausführung werden dabei präzise aufeinander abgestimmt.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.holzbau,
          alt: "Holzbau",
          layout: "pair",
          objectClass: "object-[center_40%]",
          pairSrc: SITE_IMAGES.stahlbau,
          pairAlt: "Stahlbau",
          pairObjectClass: "object-[center_30%]",
        },
      ],
    },
    {
      id: "hallenbau",
      number: "6",
      title: "Industrie- und Hallenbau",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Für Industrie- und Hallenbauten entwickeln wir wirtschaftliche Tragwerkskonzepte mit klaren konstruktiven Systemen und abgestimmten Lösungen für Spannweiten, Nutzung und Ausführung.",
          ],
        },
      ],
    },
    {
      id: "pruefung",
      number: "7",
      title: "Baustatische Prüfung",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Das Ingenieurbüro Dr. Rausch übernimmt die unabhängige Prüfung von Standsicherheitsnachweisen mit bauaufsichtlicher Anerkennung und langjähriger Erfahrung in der baustatischen Prüfung. Die Prüfung erfolgt dabei stets unabhängig und grundsätzlich getrennt von der Planung.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.abnahme,
          alt: "Abnahme auf der Baustelle",
          layout: "wide",
        },
      ],
    },
    {
      id: "ablauf",
      number: "8",
      title: "Vom ersten Konzept bis zur Ausführung",
      blocks: [
        {
          type: "paragraphs",
          paragraphs: [
            "Jedes Bauvorhaben stellt eigene Anforderungen an Konstruktion, Nutzung, Wirtschaftlichkeit und Ausführung. Deshalb entwickeln wir Tragwerke nicht schematisch, sondern abgestimmt auf die jeweilige Bauaufgabe und ihre konstruktiven Anforderungen. Von der ersten Analyse bis zur Umsetzung begleiten wir Projekte mit technischer Präzision, konstruktiver Erfahrung und enger Abstimmung mit Architekten, Bauherren und Fachplanern.",
            "01 Analyse — Wir analysieren die Anforderungen des Bauvorhabens, die konstruktiven Randbedingungen und das statische System als Grundlage für eine wirtschaftliche und sichere Tragwerksplanung. Standort, Nutzung, Geometrie, Materialwahl und Ausführungsbedingungen fließen dabei von Beginn an in die Planung ein.",
            "02 Konzept — Auf Basis der Anforderungen entwickeln wir durchdachte Tragwerkskonzepte und untersuchen unterschiedliche konstruktive Lösungen. Konstruktion, Materialwahl und statisches System werden präzise auf Architektur, Nutzung und Wirtschaftlichkeit abgestimmt.",
            "03 Planung — Wir erstellen statische Berechnungen, Detailplanungen und konstruktive Ausführungsunterlagen für die sichere und wirtschaftliche Umsetzung des Tragwerks. Die Abstimmung mit Architekten, Fachplanern und ausführenden Firmen ist dabei ebenso wesentlicher Bestandteil unserer Arbeit wie die kontinuierliche Begleitung des Projekts über alle Planungs- und Ausführungsphasen.",
            "04 Umsetzung — Während der Ausführung begleiten wir das Projekt mit technischer Abstimmung, konstruktiver Klarheit und sorgfältiger Qualitätssicherung. Auch bei komplexen Bauabläufen, Umbauten im Bestand oder anspruchsvollen Tragstrukturen stellen wir sicher, dass das Planungskonzept konstruktiv präzise und wirtschaftlich umgesetzt wird.",
          ],
        },
        {
          type: "image",
          src: SITE_IMAGES.bauueberwachung,
          alt: "Bauüberwachung",
          layout: "wide",
        },
      ],
    },
  ],
  teasers: [
    {
      title: "Tragwerksplanung",
      text: "Wir entwickeln das statische System, dimensionieren Querschnitte und Verbindungen und koordinieren die Konstruktion mit Architektur und Fachplanung – von der Vorbemessung bis zur Ausführungsplanung.",
      href: "/tragwerksplanung",
      linkLabel: "Mehr erfahren",
    },
    {
      title: "Prüfung",
      text: "Wir prüfen statische Berechnungen, Tragwerkskonzepte und konstruktive Details unabhängig und normkonform – als technische Qualitätssicherung für Bauherren, Architekten und Behörden.",
      href: "/pruefung",
      linkLabel: "Mehr erfahren",
    },
  ],
};
