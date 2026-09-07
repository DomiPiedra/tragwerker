import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_LEGAL, SITE_NAME } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";

export const metadata: Metadata = buildStaticMetadata({
  title: `Datenschutz — ${SITE_NAME}`,
  description: "Datenschutzerklärung der Tragwerker GmbH gemäß DSGVO.",
  path: "/datenschutz",
});

function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="site-grid-span-6 md:site-grid-span-5">
      <h2 className="font-site-sans text-xs font-normal uppercase tracking-[0.2em] text-[var(--site-ink)]">
        {title}
      </h2>
      <div className="mt-4 space-y-3 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
        {children}
      </div>
    </div>
  );
}

export default function DatenschutzPage() {
  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Datenschutz"
        headline="Informationen zur Verarbeitung personenbezogener Daten auf unserer Website."
      />

      <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
        <div className="site-grid gap-y-12 md:gap-y-16">
          <LegalBlock title="1. Datenschutz auf einen Blick">
            <p>
              Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen
              Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle
              Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
            <p>
              <strong className="font-normal text-[var(--site-ink)]">
                Wer ist verantwortlich für die Datenerfassung auf dieser Website?
              </strong>
              <br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
              Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
            <p>
              <strong className="font-normal text-[var(--site-ink)]">
                Wie erfassen wir Ihre Daten?
              </strong>
              <br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen — etwa per
              E-Mail. Andere Daten werden automatisch beim Besuch der Website durch unsere
              IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser,
              Betriebssystem oder Uhrzeit des Seitenaufrufs).
            </p>
            <p>
              <strong className="font-normal text-[var(--site-ink)]">
                Wofür nutzen wir Ihre Daten?
              </strong>
              <br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
              gewährleisten. Andere Daten können zur Bearbeitung Ihrer Anfragen verwendet werden.
            </p>
            <p>
              <strong className="font-normal text-[var(--site-ink)]">
                Welche Rechte haben Sie bezüglich Ihrer Daten?
              </strong>
              <br />
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und
              Zweck Ihrer gespeicherten personenbezogenen Daten. Sie haben außerdem ein Recht auf
              Berichtigung oder Löschung dieser Daten sowie weitere Rechte nach der DSGVO. Hierzu
              sowie zu weiteren Fragen zum Datenschutz können Sie sich jederzeit an uns wenden.
            </p>
          </LegalBlock>

          <LegalBlock title="2. Verantwortliche Stelle">
            <p>{SITE_LEGAL.companyName}</p>
            <p>{SITE_LEGAL.contentResponsible}</p>
            <p>{SITE_LEGAL.street}</p>
            <p>{SITE_LEGAL.zipCity}</p>
            <p>Telefon: {SITE_LEGAL.phone}</p>
            <p>
              E-Mail:{" "}
              <a href={`mailto:${SITE_LEGAL.email}`} className="underline-offset-4 hover:underline">
                {SITE_LEGAL.email}
              </a>
            </p>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
              gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
              personenbezogenen Daten entscheidet.
            </p>
          </LegalBlock>

          <LegalBlock title="3. Hosting">
            <p>
              Diese Website wird bei einem professionellen Hosting-Anbieter betrieben. Beim Besuch
              unserer Website werden durch den Hosting-Anbieter Verbindungsdaten (insbesondere
              IP-Adresse, Datum und Uhrzeit der Anfrage, übertragene Datenmenge) in sogenannten
              Server-Logdateien verarbeitet. Die Verarbeitung erfolgt zur Bereitstellung und
              Sicherheit der Website auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>
            <p>
              Sofern ein Auftragsverarbeitungsvertrag mit dem Hosting-Anbieter besteht, erfolgt die
              Verarbeitung auf Grundlage von Art. 28 DSGVO.
            </p>
          </LegalBlock>

          <LegalBlock title="4. Server-Log-Dateien">
            <p>
              Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten
              Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p>
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die
              Erfassung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber
              hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und
              Optimierung seiner Website.
            </p>
          </LegalBlock>

          <LegalBlock title="5. Kontaktaufnahme per E-Mail">
            <p>
              Diese Website verwendet kein Kontaktformular. Wenn Sie uns per E-Mail kontaktieren,
              werden Ihre Angaben inklusive der von Ihnen mitgeteilten Kontaktdaten zum Zweck der
              Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
              Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre
              Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung
              vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die
              Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an
              uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) bzw. auf Ihrer Einwilligung
              (Art. 6 Abs. 1 lit. a DSGVO), sofern diese abgefragt wurde.
            </p>
            <p>
              Die von Ihnen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung
              auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die
              Datenspeicherung entfällt. Zwingende gesetzliche Bestimmungen — insbesondere
              Aufbewahrungsfristen — bleiben unberührt.
            </p>
          </LegalBlock>

          <LegalBlock title="6. Cookies">
            <p>
              Unsere Website setzt technisch notwendige Cookies bzw. vergleichbare Speichermechanismen
              nur ein, soweit dies für den Betrieb der Website erforderlich ist (z. B. für
              Session-Verwaltung im passwortgeschützten CMS-Bereich). Eine Analyse Ihres
              Surfverhaltens mittels Tracking-Cookies findet derzeit nicht statt.
            </p>
            <p>
              Soweit Cookies zur Durchführung des elektronischen Kommunikationsvorgangs oder zur
              Bereitstellung bestimmter von Ihnen erwünschter Funktionen erforderlich sind, erfolgt
              die Speicherung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO bzw. § 25 Abs. 2 TDDDG.
            </p>
          </LegalBlock>

          <LegalBlock title="7. Schriften">
            <p>
              Zur einheitlichen Darstellung von Schriftarten werden auf dieser Website lokale bzw.
              über den Build-Prozess eingebundene Webfonts verwendet. Ein Abruf von Schriftarten
              durch Ihren Browser bei Drittanbietern während des Seitenaufrufs ist dadurch in der
              Regel nicht erforderlich.
            </p>
          </LegalBlock>

          <LegalBlock title="8. Ihre Rechte">
            <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
            </ul>
            <p>
              Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich
              jederzeit unter der oben genannten Adresse an uns wenden.
            </p>
          </LegalBlock>

          <LegalBlock title="9. Beschwerderecht bei der Aufsichtsbehörde">
            <p>
              Im Falle von Verstößen gegen die DSGVO steht Betroffenen ein Beschwerderecht bei einer
              Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts,
              ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Zuständige
              Aufsichtsbehörde in Bayern ist das Bayerische Landesamt für Datenschutzaufsicht
              (BayLDA).
            </p>
          </LegalBlock>

          <LegalBlock title="10. SSL- bzw. TLS-Verschlüsselung">
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
              Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen
              Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und
              an dem Schloss-Symbol in Ihrer Browserzeile.
            </p>
          </LegalBlock>
        </div>
      </section>
    </>
  );
}
