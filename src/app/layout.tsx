import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { GlobalCommandBar } from "@/components/command/global-command-bar";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tragwerker",
  description: "Ingenieurbüro für Tragwerksplanung und Prüfung",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className={`${GeistSans.className} flex min-h-full flex-col`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
