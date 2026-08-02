"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { SITE_HEADER_NAME } from "@/website/tragwerker/config";
import { SiteMenuOverlay } from "@/website/tragwerker/components/site-menu-overlay";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 mix-blend-difference",
          menuOpen && "pointer-events-none opacity-0"
        )}
      >
        <div className="site-container flex items-center justify-between gap-8 py-8 text-white md:py-10">
          <Link href="/" className="font-site-sans text-lg tracking-[-0.01em] transition-opacity hover:opacity-70 md:text-xl">
            {SITE_HEADER_NAME}
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setMenuOpen(true)}
            className="font-site-sans text-sm tracking-[-0.01em] transition-opacity hover:opacity-70 md:text-base"
          >
            Menü
          </button>
        </div>
      </header>

      <SiteMenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
