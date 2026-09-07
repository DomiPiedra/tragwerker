import { cn } from "@/lib/utils";

type TimelineEntry = {
  year: string;
  lines: string[];
};

const OFFICE_TIMELINE: TimelineEntry[] = [
  {
    year: "1959",
    lines: ["Dipl.-Ing. Helmut und Walter Held gründen das Ingenieurbüro Held"],
  },
  {
    year: "1993",
    lines: [
      "Dr.-Ing. Martin Rausch tritt in das Ingenieurbüro Held ein",
      "Das Büro wird in Ingenieurbüro Held und Rausch umbenannt",
    ],
  },
  {
    year: "2001",
    lines: [
      "Das Büro wird in Ingenieurbüro Dr. Rausch umbenannt",
      "Dr.-Ing. Martin Rausch wird zum Prüfingenieur ernannt",
    ],
  },
  {
    year: "2016",
    lines: [
      "Die Tragwerksplanung wird in Die Tragwerker GmbH überführt",
      "Ingenieurbüro Dr. Rausch führt die baustatische Prüfung fort",
    ],
  },
  {
    year: "2024",
    lines: ["Dr.-Ing. Niclas Rausch übernimmt und führt Die Tragwerker GmbH weiter"],
  },
];

export function SiteOfficeTimeline({ className }: { className?: string }) {
  return (
    <ol className={cn("space-y-10 md:space-y-12", className)}>
      {OFFICE_TIMELINE.map((entry) => (
        <li key={entry.year} className="grid grid-cols-[4rem_1fr] gap-6 md:grid-cols-[5rem_1fr] md:gap-8">
          <p className="pt-0.5 font-site-sans text-xs font-extralight tracking-[0.2em] text-[var(--site-muted)]">
            {entry.year}
          </p>
          <div className="space-y-2 border-l border-[var(--site-line)] pl-6 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-ink)] md:pl-8">
            {entry.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
