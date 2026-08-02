import type { Metadata } from "next";

import { SITE_NAME } from "@/website/tragwerker/config";
import { defaultKompetenzen } from "@/website/tragwerker/defaults/content";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getPageSections } from "@/website/tragwerker/queries";
import { ContentPageTemplate } from "@/website/tragwerker/templates/content-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticMetadata({
    title: `Kompetenzen — ${SITE_NAME}`,
    description: defaultKompetenzen.hero?.headline ?? defaultKompetenzen.hero?.intro ?? "",
    path: "/kompetenzen",
  });
}

export default async function KompetenzenPage() {
  const page = await getPageSections("kompetenzen");
  const base = page?.sections ?? defaultKompetenzen;
  const sections = {
    ...base,
    hero: {
      ...defaultKompetenzen.hero!,
      ...base.hero,
      imageUrl: SITE_IMAGES.heroKompetenzen,
    },
  };
  return <ContentPageTemplate sections={sections} />;
}
