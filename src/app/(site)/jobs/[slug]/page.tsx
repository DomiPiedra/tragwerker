import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/website/tragwerker/components/section-heading";
import { SiteContactCta } from "@/website/tragwerker/components/site-contact-cta";
import { SitePageHeadingSection } from "@/website/tragwerker/components/site-page-heading";
import { SiteRichText } from "@/website/tragwerker/components/site-rich-text";
import { SITE_CONTACT_EMAIL } from "@/website/tragwerker/config";
import { stripHtml } from "@/website/tragwerker/lib/html";
import { buildEntityMetadata } from "@/website/tragwerker/metadata";
import { getJobBySlug } from "@/website/tragwerker/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  const description = stripHtml(job.shortDescription || job.content || "");
  return buildEntityMetadata("job", job.id, {
    title: `${job.title} — Tragwerker`,
    description,
    path: `/jobs/${job.slug}`,
  });
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const mailto = job.applicationEmail ?? SITE_CONTACT_EMAIL;
  const meta = [job.location, job.employmentType, job.department].filter(Boolean).join(" · ");
  const intro = job.shortDescription ? stripHtml(job.shortDescription) : undefined;

  return (
    <article>
      <SitePageHeadingSection
        placement="standalone"
        pageName="Jobs"
        headline={job.title}
        intro={intro}
      />

      {meta ? (
        <section className="site-container border-t border-[var(--site-line)] py-8 md:py-10">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--site-muted)]">{meta}</p>
        </section>
      ) : null}

      {job.content ? (
        <section className="site-container max-w-3xl border-t border-[var(--site-line)] py-12 md:py-16">
          <SectionHeading eyebrow="Stelle" title="Beschreibung" />
          <SiteRichText html={job.content} className="mt-8 md:mt-10" />
        </section>
      ) : null}

      {job.requirements ? (
        <section className="site-container max-w-3xl border-t border-[var(--site-line)] py-12 md:py-16">
          <SectionHeading eyebrow="Profil" title="Anforderungen" />
          <SiteRichText html={job.requirements} className="mt-8 md:mt-10" />
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
