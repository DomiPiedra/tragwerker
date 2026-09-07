import Link from "next/link";

import { SitePageHeading } from "@/website/tragwerker/components/site-page-heading";

export function SiteNotFoundView() {
  return (
    <section className="site-container flex min-h-[60vh] flex-col justify-center py-24">
      <SitePageHeading
        pageName="404"
        headline="Seite nicht gefunden."
        intro="Die angeforderte Seite existiert nicht."
      />
      <Link
        href="/"
        className="mt-10 inline-flex min-h-11 items-center font-site-sans text-base font-extralight tracking-[-0.01em] site-link"
      >
        Zur Startseite
      </Link>
    </section>
  );
}
