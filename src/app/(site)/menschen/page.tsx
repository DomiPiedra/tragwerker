import type { Metadata } from "next";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SiteFullBleedHero } from "@/website/tragwerker/components/site-full-bleed-hero";
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
  const leadership = team.filter((m) => m.featured);
  const engineers = team.filter((m) => !m.featured);

  return (
    <>
      <SiteFullBleedHero
        imageSrc={SITE_IMAGES.heroMenschen}
        imageAlt="Team unterwegs in den Bergen"
        heading={{
          pageName: "Team",
          headline: "Hinter jedem Tragwerk steht ein Team, das Verantwortung übernimmt.",
        }}
      />

      {leadership.length > 0 ? (
        <SiteReveal>
          <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
            <SectionHeading eyebrow="Geschäftsführung" title="Leitung" />
            <div className="mt-14 grid gap-16 md:grid-cols-2 lg:grid-cols-4">
              {leadership.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  name={member.name}
                  role={member.role}
                  avatarUrl={member.avatarUrl}
                  bio={member.bio}
                  size="leadership"
                />
              ))}
            </div>
          </section>
        </SiteReveal>
      ) : null}

      {engineers.length > 0 ? (
        <SiteReveal>
          <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              {engineers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  name={member.name}
                  role={member.role}
                  avatarUrl={member.avatarUrl}
                  expertise={member.expertise}
                />
              ))}
            </div>
          </section>
        </SiteReveal>
      ) : null}

      <SiteContactCta
        headline="Werden Sie Teil unseres Teams"
        text="Wir suchen engagierte Ingenieurinnen und Ingenieure."
        buttonLabel="Offene Stellen"
        href="/jobs"
      />
    </>
  );
}
