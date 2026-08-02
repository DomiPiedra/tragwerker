import { DM_Sans, Instrument_Serif } from "next/font/google";

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
  variable: "--font-dm-sans",
});

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tragwerker-site min-h-screen ${instrumentSerif.variable} ${dmSans.variable}`}>
      <SiteHeader />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
