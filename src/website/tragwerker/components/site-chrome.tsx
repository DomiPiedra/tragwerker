import { DM_Sans, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { SITE_IMAGES } from "@/website/tragwerker/images";
import { SiteFooter } from "@/website/tragwerker/components/site-footer";
import { SiteHeader } from "@/website/tragwerker/components/site-header";

import "@/website/tragwerker/styles/site.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-dm-sans",
});

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className={`tragwerker-site min-h-screen ${instrumentSerif.variable} ${dmSans.variable}`}>
      <div className="site-blueprint" style={{ backgroundImage: `url(${SITE_IMAGES.heroHomeWireframe})` }} aria-hidden="true" />
      <SiteHeader />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
