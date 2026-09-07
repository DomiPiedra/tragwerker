import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SiteReveal } from "@/website/tragwerker/components/site-reveal";
import { SITE_NAME, SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getPublishedJobs } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildStaticMetadata({
  title: `Jobs — ${SITE_NAME}`,
  description: "Offene Stellen bei der Tragwerker GmbH.",
  path: "/jobs",
});

export default async function JobsPage() {
  const jobs = await getPublishedJobs();

  return (
    <>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Karriere"
        headline="Projekte, Arbeitsweise, Verantwortung."
      />

      <SiteReveal>
        <section className="site-container border-t border-[var(--site-line)] py-20 md:py-28 lg:py-32">
          <SectionHeading eyebrow="Offene Stellen" title="Karriere" />
          <div className="mt-12 space-y-0 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
            {jobs.length === 0 ? (
              <p className="py-10 text-[var(--site-muted)]">Derzeit keine offenen Stellen veröffentlicht.</p>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="site-link-quiet flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="font-site-serif text-2xl tracking-tight md:text-3xl">{job.title}</h3>
                    <p className="mt-2 text-sm text-[var(--site-muted)]">
                      {[job.location, job.employmentType].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em]">Details →</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </SiteReveal>

      <SiteContactCta
        headline="Initiativbewerbung"
        text="Keine passende Stelle? Schreiben Sie uns."
        buttonLabel="Bewerbung senden"
        mailto={SITE_CONTACT_EMAIL}
      />
    </>
  );
}
