import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { buildEntityMetadata } from "@/website/tragwerker/metadata";
import { getJobBySlug } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  return buildEntityMetadata("job", job.id, {
    title: `${job.title} — Tragwerker`,
    description: job.shortDescription ?? "",
    path: `/jobs/${job.slug}`,
  });
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const mailto = job.applicationEmail ?? SITE_CONTACT_EMAIL;

  return (
    <article>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Jobs"
        headline={job.title}
        intro={job.shortDescription ?? undefined}
      />

      <section className="site-container border-t border-[var(--site-line)] py-12 md:py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--site-muted)]">
          {[job.location, job.employmentType, job.department].filter(Boolean).join(" · ")}
        </p>
      </section>

      {job.content ? (
        <section className="site-container max-w-3xl border-t border-[var(--site-line)] py-12 md:py-16">
          <SectionHeading eyebrow="Stelle" title="Beschreibung" description={job.content} />
        </section>
      ) : null}

      {job.requirements ? (
        <section className="site-container max-w-3xl py-12 md:py-16">
          <SectionHeading eyebrow="Profil" title="Anforderungen" description={job.requirements} />
        </section>
      ) : null}

      <SiteContactCta
        headline="Jetzt bewerben"
        text="Senden Sie uns Ihre Unterlagen per E-Mail."
        buttonLabel="Bewerbung senden"
        mailto={mailto}
      />
    </article>
  );
}
