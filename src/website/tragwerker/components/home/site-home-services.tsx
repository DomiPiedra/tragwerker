import Link from "next/link";

import { cn } from "@/lib/utils";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SiteSectionLabel } from "@/website/tragwerker/components/site-section-label";

const disciplines = [
  {
    href: "/tragwerksplanung",
    label: "Tragwerksplanung",
    text: "Wir entwickeln das statische System, dimensionieren Querschnitte und Verbindungen und koordinieren die Konstruktion mit Architektur und Fachplanung – von der Vorbemessung bis zur Ausführungsplanung.",
  },
  {
    href: "/pruefung",
    label: "Prüfung",
    text: "Wir prüfen statische Berechnungen, Tragwerkskonzepte und konstruktive Details unabhängig und normkonform – als technische Qualitätssicherung für Bauherren, Architekten und Behörden.",
  },
] as const;

export function SiteHomeServices() {
  return (
    <SiteReveal>
      <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
        <SiteSectionLabel index="002" title="LEISTUNGEN" />
        <h2 className="mt-4 font-site-serif text-3xl font-normal tracking-[-0.02em] text-[var(--site-ink)] md:text-4xl">
          Tragwerksplanung und Prüfung
        </h2>
        <p className="mt-4 max-w-xl font-site-sans text-base font-extralight text-[var(--site-muted)]">
          Aus einer Hand, mit klarer fachlicher Verantwortung
        </p>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 md:gap-0">
          {disciplines.map((item, index) => (
            <article
              key={item.href}
              className={cn(
                "border-t border-[var(--site-line)] pt-8",
                index > 0 && "md:border-l md:pl-12 md:ml-12 lg:pl-16 lg:ml-16"
              )}
            >
              <Link href={item.href} className="site-link-quiet block font-site-sans text-[1.75rem] font-normal leading-[1.12] tracking-[-0.03em] text-[var(--site-ink)] md:text-[2.25rem]">
                {item.label}
              </Link>
              <p className="mt-5 max-w-[65ch] font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </SiteReveal>
  );
}
