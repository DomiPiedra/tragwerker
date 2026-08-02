import Link from "next/link";

import { SitePageHeading } from "@/website/tragwerker/components/site-page-heading";

export default function SiteNotFound() {
  return (
    <section className="site-container flex min-h-[60vh] flex-col justify-center py-24">
      <SitePageHeading
        pageName="404"
        headline="Seite nicht gefunden."
        intro="Die angeforderte Seite existiert nicht."
      />
      <Link
        href="/"
        className="mt-10 inline-block text-xs uppercase tracking-[0.2em] underline underline-offset-4"
      >
        Zur Startseite
      </Link>
    </section>
  );
}
