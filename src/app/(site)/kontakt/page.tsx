import type { Metadata } from "next";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SITE_NAME, SITE_CONTACT_EMAIL, SITE_PHONE, SITE_ADDRESS } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";

export const metadata: Metadata = buildStaticMetadata({
  title: `Kontakt — ${SITE_NAME}`,
  description: "Kontaktieren Sie die Tragwerker GmbH in Germering bei München.",
  path: "/kontakt",
});

export default function KontaktPage() {
  const addressLines = SITE_ADDRESS.split("\n");

  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Kontakt"
        headline="Lassen Sie uns sprechen."
        intro="Für Anfragen, Kooperationen oder fachlichen Austausch stehen wir gerne zur Verfügung."
      />
      <SiteReveal>
        <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
          <div className="site-grid items-start gap-y-12">
            <div className="site-grid-span-3">
              <SectionHeading eyebrow="Erreichbarkeit" title="Ansprechpartner" />
            </div>
            <div className="site-grid-span-4 space-y-12 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
              <div>
                <p className="text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-ink)]">
                  Die Tragwerker GmbH
                </p>
                <p className="mt-2">Tragwerksplanung</p>
                <p className="mt-1">Dr.-Ing. Niclas Rausch</p>
                <p>Dipl.-Ing. (FH) Michael Knittler</p>
                {addressLines.map((line) => (
                  <p key={line} className="mt-2">
                    {line}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-ink)]">
                  Ingenieurbüro Dr. Rausch
                </p>
                <p className="mt-2">Baustatische Prüfung</p>
                <p className="mt-1">Dr.-Ing. Martin Rausch</p>
              </div>
              <div>
                <p className="text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-ink)]">Telefon</p>
                <a href={`tel:${SITE_PHONE.replace(/\s/g, "")}`} className="site-link mt-2 inline-block">
                  {SITE_PHONE}
                </a>
              </div>
              <div>
                <p className="text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-ink)]">E-Mail</p>
                <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="site-link mt-2 inline-block">
                  {SITE_CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </section>
      </SiteReveal>
      <SiteContactCta
        headline="Projekt anfragen"
        text="Schreiben Sie uns — wir melden uns zeitnah."
        buttonLabel="E-Mail senden"
        mailto={SITE_CONTACT_EMAIL}
      />
    </>
  );
}
