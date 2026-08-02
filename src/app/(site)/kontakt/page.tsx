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
        <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
          <div className="site-grid items-start gap-y-12">
            <div className="site-grid-span-3">
              <SectionHeading eyebrow="Erreichbarkeit" title="Büro & Kontakt" />
            </div>
            <div className="site-grid-span-4 space-y-8 text-base leading-relaxed text-[var(--site-muted)]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-ink)]">Büro</p>
                {addressLines.map((line) => (
                  <p key={line} className="mt-2">
                    {line}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-ink)]">Telefon</p>
                <a href={`tel:${SITE_PHONE.replace(/\s/g, "")}`} className="mt-2 block hover:underline">
                  {SITE_PHONE}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-ink)]">E-Mail</p>
                <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="mt-2 block hover:underline">
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
