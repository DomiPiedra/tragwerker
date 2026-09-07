import type { Metadata } from "next";

import { SITE_NAME } from "@/website/tragwerker/config";
import { defaultPruefung } from "@/website/tragwerker/defaults/content";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildEntityMetadata, buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getServiceBySlug, getServiceSections } from "@/website/tragwerker/queries";
import { ServicePageTemplate } from "@/website/tragwerker/templates/service-page";
import type { ServiceSections } from "@/website/tragwerker/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const service = await getServiceBySlug("pruefung");
  const fallback = {
    title: `Prüfung — ${SITE_NAME}`,
    description: "Unabhängige Prüfung von Tragwerken. Technische Verantwortung und Qualitätssicherung.",
    path: "/pruefung",
  };
  if (service) return buildEntityMetadata("service", service.id, fallback);
  return buildStaticMetadata(fallback);
}

export default async function PruefungPage() {
  const data = await getServiceSections("pruefung");
  const sections: ServiceSections = data?.sections ?? defaultPruefung;

  return (
    <ServicePageTemplate
      title={data?.service.title ?? "Prüfung"}
      summary={
        data?.service.summary ??
        "Prüfung bedeutet, Tragwerke dauerhaft sicher und konstruktiv nachvollziehbar zu machen."
      }
      heroImageUrl={SITE_IMAGES.heroReview}
      heroImageFallback={SITE_IMAGES.heroReview}
      sections={sections}
      cta={{
        headline: data?.service.ctaHeadline ?? "Prüfung anfragen",
        text: data?.service.ctaText ?? "Kontaktieren Sie uns für eine unverbindliche Terminabsprache.",
        buttonLabel: data?.service.ctaButtonLabel ?? "E-Mail senden",
        email: data?.service.ctaEmail,
      }}
    />
  );
}
