import Link from "next/link";

import {
  SITE_ADDRESS,
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_PHONE,
  SITE_SHORT_NAME,
} from "@/website/tragwerker/config";

export function SiteFooter() {
  const addressLines = SITE_ADDRESS.split("\n");

  return (
    <footer className="site-container border-t border-[var(--site-line)] py-16 md:py-20">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-site-serif text-3xl tracking-tight">{SITE_SHORT_NAME}</p>
          <p className="mt-4 max-w-sm font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
            Ingenieurbüro für Tragwerksplanung und Prüfung in Germering bei München.
          </p>
        </div>
        <div className="space-y-3 font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
          <p className="text-[var(--site-ink)]">Leistungen</p>
          <Link href="/tragwerksplanung" className="block hover:text-[var(--site-ink)]">
            Tragwerksplanung
          </Link>
          <Link href="/pruefung" className="block hover:text-[var(--site-ink)]">
            Prüfung
          </Link>
          <Link href="/projekte" className="block hover:text-[var(--site-ink)]">
            Projekte
          </Link>
        </div>
        <div className="space-y-2 font-site-sans text-sm font-extralight text-[var(--site-muted)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-ink)]">Büro</p>
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <a href={`tel:${SITE_PHONE.replace(/\s/g, "")}`} className="block hover:text-[var(--site-ink)]">
            {SITE_PHONE}
          </a>
          <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="block hover:text-[var(--site-ink)]">
            {SITE_CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-[var(--site-line)] pt-8 font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">
        <span>TW</span>
        <span>
          © {new Date().getFullYear()} {SITE_NAME}
        </span>
        <Link href="/impressum" className="hover:text-[var(--site-ink)]">
          Impressum
        </Link>
        <Link href="/datenschutz" className="hover:text-[var(--site-ink)]">
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
