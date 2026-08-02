import type { Metadata } from "next";

import { SITE_NAME } from "@/website/tragwerker/config";
import { defaultTragwerksplanung } from "@/website/tragwerker/defaults/content";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildEntityMetadata, buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getServiceBySlug, getServiceSections } from "@/website/tragwerker/queries";
import { ServicePageTemplate } from "@/website/tragwerker/templates/service-page";
import type { ServiceSections } from "@/website/tragwerker/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const service = await getServiceBySlug("tragwerksplanung");
  const fallback = {
    title: `Tragwerksplanung — ${SITE_NAME}`,
    description: "Tragwerksplanung — Von der Vorbemessung bis zur Ausführung.",
    path: "/tragwerksplanung",
  };
  if (service) return buildEntityMetadata("service", service.id, fallback);
  return buildStaticMetadata(fallback);
}

export default async function TragwerksplanungPage() {
  const data = await getServiceSections("tragwerksplanung");
  const base = data?.sections ?? defaultTragwerksplanung;
  const sections: ServiceSections = {
    ...base,
    intro: {
      ...defaultTragwerksplanung.intro!,
      imageUrl: undefined,
    },
    process: defaultTragwerksplanung.process,
    deliverables: defaultTragwerksplanung.deliverables,
    expertise: undefined,
  };

  return (
    <ServicePageTemplate
      title={data?.service.title ?? "Tragwerksplanung"}
      summary="Von der Vorbemessung bis zur Ausführung."
      heroImageUrl={SITE_IMAGES.heroPlanning}
      heroImageFallback={SITE_IMAGES.heroPlanning}
      sections={sections}
      cta={{
        headline: "Projekt besprechen",
        text: "Leistungsumfang, Schnittstellen und Termine klären wir am besten früh – idealerweise bereits im Vorentwurf.",
        buttonLabel: "Kontakt aufnehmen",
        email: data?.service.ctaEmail,
      }}
    />
  );
}
