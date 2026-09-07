import type { Metadata } from "next";

import { SITE_NAME } from "@/website/tragwerker/config";
import { defaultKompetenzenPage } from "@/website/tragwerker/defaults/kompetenzen-page";
import { buildStaticMetadata } from "@/website/tragwerker/metadata";
import { KompetenzenPageTemplate } from "@/website/tragwerker/templates/kompetenzen-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticMetadata({
    title: `Kompetenzen — ${SITE_NAME}`,
    description:
      "Unsere Arbeitsweise verbindet analytische Präzision mit materialgerechtem Denken — vom ersten Konzept bis zur letzten Schraube.",
    path: "/kompetenzen",
  });
}

export default function KompetenzenPage() {
  return <KompetenzenPageTemplate content={defaultKompetenzenPage} />;
}
