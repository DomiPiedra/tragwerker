import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_LEGAL, SITE_NAME } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";

export const metadata: Metadata = buildStaticMetadata({
  title: `Impressum — ${SITE_NAME}`,
  description: "Impressum der Tragwerker GmbH gemäß § 5 DDG.",
  path: "/impressum",
});

function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="site-grid-span-6 md:site-grid-span-5">
      <h2 className="font-site-sans text-xs font-normal uppercase tracking-[0.2em] text-[var(--site-ink)]">
        {title}
      </h2>
      <div className="mt-4 space-y-2 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
        {children}
      </div>
    </div>
  );
}

export default function ImpressumPage() {
  const { chamber, profession, insurance } = SITE_LEGAL;

  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Impressum"
        headline="Angaben gemäß § 5 DDG und gesetzlich vorgeschriebene Kontaktdaten."
      />

      <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
        <div className="site-grid gap-y-12 md:gap-y-16">
          <LegalBlock title="Anbieter">
            <p>{SITE_LEGAL.companyName}</p>
            <p>{SITE_LEGAL.street}</p>
            <p>{SITE_LEGAL.zipCity}</p>
          </LegalBlock>

          <LegalBlock title="Vertreten durch">
            {SITE_LEGAL.managingDirectors.map((name) => (
              <p key={name}>{name}</p>
            ))}
            <p className="pt-2">Geschäftsführer</p>
          </LegalBlock>

          <LegalBlock title="Kontakt">
            <p>Telefon: {SITE_LEGAL.phone}</p>
            <p>Telefax: {SITE_LEGAL.fax}</p>
            <p>
              E-Mail:{" "}
              <a href={`mailto:${SITE_LEGAL.email}`} className="underline-offset-4 hover:underline">
                {SITE_LEGAL.email}
              </a>
            </p>
          </LegalBlock>

          <LegalBlock title="Registereintrag">
            <p>Eintragung im Handelsregister.</p>
            <p>Registergericht: {SITE_LEGAL.registerCourt}</p>
            <p>Registernummer: {SITE_LEGAL.registerNumber}</p>
          </LegalBlock>

          <LegalBlock title="Umsatzsteuer">
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {SITE_LEGAL.vatId}
            </p>
          </LegalBlock>

          <LegalBlock title="Aufsichtsbehörde / Kammer">
            <p>{chamber.name}</p>
            <p>Mitgliedsnummer: {chamber.membershipNumber}</p>
            <p>Körperschaft des öffentlichen Rechts</p>
            {chamber.address.split("\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>
              <a
                href={chamber.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {chamber.url}
              </a>
            </p>
          </LegalBlock>

          <LegalBlock title="Berufsbezeichnung und berufsrechtliche Regelungen">
            <p>Berufsbezeichnung: {profession.title}</p>
            <p>Verliehen in: Bundesrepublik Deutschland</p>
            <p>Es gelten folgende berufsrechtliche Regelungen:</p>
            <p>{profession.regulations}</p>
            <p>
              Regelungen einsehbar unter:{" "}
              <a
                href={profession.regulationsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                gesetze-bayern.de
              </a>
            </p>
          </LegalBlock>

          <LegalBlock title="Berufshaftpflichtversicherung">
            <p>{insurance.name}</p>
            {insurance.address.split("\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>Geltungsraum der Versicherung: {insurance.scope}</p>
          </LegalBlock>

          <LegalBlock title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
            <p>{SITE_LEGAL.companyName}</p>
            <p>{SITE_LEGAL.contentResponsible}</p>
            <p>{SITE_LEGAL.street}</p>
            <p>{SITE_LEGAL.zipCity}</p>
          </LegalBlock>

          <LegalBlock title="Streitschlichtung">
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              .
            </p>
            <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </LegalBlock>

          <LegalBlock title="Haftung für Inhalte">
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
              erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
              Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
              entfernen.
            </p>
          </LegalBlock>

          <LegalBlock title="Haftung für Links">
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
              übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt
              der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
              Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </LegalBlock>

          <LegalBlock title="Urheberrecht">
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien
              dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
              Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam
              werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </LegalBlock>
        </div>
      </section>
    </>
  );
}
