import type { Metadata } from "next";

import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
import { SiteOfficeTimeline } from "@/website/tragwerker/components/site-office-timeline";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { TeamMemberCard } from "@/website/tragwerker/components/team-member-card";
import { SITE_NAME } from "@/website/tragwerker/config";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getPublishedTeam } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildStaticMetadata({
  title: `Menschen — ${SITE_NAME}`,
  description: "Das Team der Tragwerker GmbH — Ingenieurinnen und Ingenieure für Tragwerksplanung.",
  path: "/menschen",
});

export default async function MenschenPage() {
  const team = await getPublishedTeam();

  return (
    <>
      <SiteFullBleedHero
        imageSrc={SITE_IMAGES.heroMenschen}
        imageAlt="Team unterwegs in den Bergen"
        heading={{
          pageName: "Menschen",
          headline: "Hinter jedem Tragwerk stehen Menschen, die Verantwortung übernehmen.",
          intro: "Erfahrung hinter durchdachten Tragwerken.",
        }}
      />

      <SiteReveal>
        <section className="site-container border-t border-[var(--site-line)] py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-0">
            <div className="space-y-5 font-site-sans text-base font-extralight leading-relaxed text-[var(--site-muted)]">
              <p>
                Seit über 66 Jahren steht unser mittelständisches Ingenieurbüro für Qualität,
                Verlässlichkeit und technisches Können.
              </p>
              <p>
                Die Tragwerker GmbH wird von Dr.-Ing. Niclas Rausch und Dipl.-Ing. (FH) Michael
                Knittler geführt.
              </p>
              <p>Das Ingenieurbüro Dr. Rausch wird von Dr.-Ing. Martin Rausch geleitet.</p>
              <p>
                Unser Ingenieurbüro besteht seit 1959. Über drei Generationen hinweg wurde das Büro
                kontinuierlich weiterentwickelt. Die Tragwerker GmbH wird heute von Dr.-Ing. Niclas
                Rausch und Dipl.-Ing. (FH) Michael Knittler gemeinsam geführt. Das Ingenieurbüro Dr.
                Rausch wird von Dr.-Ing. Martin Rausch als Büro für die baustatische Prüfung geleitet.
              </p>
              <p>
                Bei uns begleiten erfahrene Fachkräfte aus Planung und Konstruktion jedes Projekt von
                der ersten Skizze bis zur Ausführung. Technische Kompetenz, präzise Planung und klare
                Kommunikation bilden die Grundlage für wirtschaftliche und praxisgerechte Lösungen, die
                sich im Bauwerk bewähren.
              </p>
            </div>
            <SiteOfficeTimeline className="border-t border-[var(--site-line)] pt-12 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12 lg:ml-12 xl:pl-16 xl:ml-16" />
          </div>
        </section>
      </SiteReveal>

      {team.length > 0 ? (
        <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
          <h2 className="font-site-serif text-3xl tracking-[-0.02em] text-[var(--site-ink)] md:text-4xl">
            Team
          </h2>
          <p className="mt-4 max-w-xl font-site-sans text-base font-extralight text-[var(--site-muted)]">
            Hinter jedem Tragwerk steht ein Team, das Verantwortung übernimmt.
          </p>
          <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <TeamMemberCard
                key={member.id}
                name={member.name}
                role={member.role}
                avatarUrl={member.avatarUrl}
              />
            ))}
          </div>
        </section>
      ) : null}

      <SiteContactCta
        headline="Offene Stellen"
        text="Projekte, Arbeitsweise, Verantwortung und Bürostruktur."
        buttonLabel="Karriere"
        href="/jobs"
      />
    </>
  );
}
