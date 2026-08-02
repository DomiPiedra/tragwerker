import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_NAME } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { searchSite } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ q?: string }> };

export const metadata: Metadata = buildStaticMetadata({
  title: `Suche — ${SITE_NAME}`,
  description: "Durchsuchen Sie Projekte, Team und Inhalte der Tragwerker Website.",
  path: "/suche",
});

export default async function SuchePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const results = query ? await searchSite(query) : [];

  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Suche"
        headline={
          query
            ? `Ergebnisse für „${query}".`
            : "Finden Sie Projekte, Teammitglieder und Inhalte auf unserer Website."
        }
        intro={query ? `${results.length} Treffer` : undefined}
      />

      <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
        <form action="/suche" method="get" className="max-w-xl">
          <label htmlFor="q" className="sr-only">
            Suchbegriff
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Suchbegriff eingeben"
            className="w-full border-b border-[var(--site-line)] bg-transparent py-3 font-site-sans text-xl outline-none md:text-2xl"
          />
        </form>

        <div className="mt-14 space-y-0 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
          {query && results.length === 0 ? (
            <p className="py-10 text-[var(--site-muted)]">Keine Ergebnisse gefunden.</p>
          ) : (
            results.map((result) => (
              <Link
                key={`${result.type}-${result.href}-${result.title}`}
                href={result.href}
                className="block py-8 transition-opacity hover:opacity-70"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-accent)]">{result.type}</p>
                <h2 className="mt-2 font-site-serif text-2xl tracking-tight">{result.title}</h2>
                {result.excerpt ? (
                  <p className="mt-2 text-sm text-[var(--site-muted)]">{result.excerpt}</p>
                ) : null}
              </Link>
            ))
          )}
        </div>

        {!query ? (
          <div className="mt-12">
            <SectionHeading
              eyebrow="Tipp"
              title="Menü öffnen"
              description="Nutzen Sie das Menü oben rechts für die vollständige Navigation."
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
