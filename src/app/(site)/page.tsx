import type { Metadata } from "next";

import { SITE_NAME, SITE_TAGLINE } from "@/website/tragwerker/config";
import { defaultHomepage } from "@/website/tragwerker/defaults/content";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { buildEntityMetadata, buildStaticMetadata } from "@/website/tragwerker/metadata";
import { getHomepageContent } from "@/website/tragwerker/queries";
import { HomePageTemplate } from "@/website/tragwerker/templates/home-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getHomepageContent();
  const fallback = {
    title: `${SITE_NAME} — Tragwerke, die bleiben.`,
    description: SITE_TAGLINE,
    path: "/",
    imageUrl: SITE_IMAGES.heroHome,
  };
  if (homepage?.page) {
    return buildEntityMetadata("page", homepage.page.id, fallback);
  }
  return buildStaticMetadata(fallback);
}

export default async function HomePage() {
  const homepage = await getHomepageContent();
  const content = homepage?.content ?? defaultHomepage;
  return <HomePageTemplate content={content} />;
}
