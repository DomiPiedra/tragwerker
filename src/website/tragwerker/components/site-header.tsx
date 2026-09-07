"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { SiteMenuOverlay } from "@/website/tragwerker/components/site-menu-overlay";
import { SiteLogoFlight } from "@/website/tragwerker/components/site-logo-flight";
import { SITE_HEADER_NAME } from "@/website/tragwerker/config";
import { SITE_LOGO_HEADER_ID } from "@/website/tragwerker/lib/logo";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [docked, setDocked] = useState(!isHome);
  const [prevIsHome, setPrevIsHome] = useState(isHome);

  if (isHome !== prevIsHome) {
    setPrevIsHome(isHome);
    setDocked(!isHome);
  }

  const handleProgress = useCallback((t: number) => {
    setDocked((prev) => {
      const next = t >= 0.92;
      return prev === next ? prev : next;
    });
  }, []);

  const visible = docked && !menuOpen;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className="flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-4"
          aria-hidden={!visible}
        >
          <nav
            aria-label="Hauptnavigation"
            className={cn(
              "site-header-glass w-full max-w-5xl transition-opacity duration-300",
              visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 md:gap-6 md:px-6 md:py-2.5">
              <Link
                href="/"
                tabIndex={visible ? 0 : -1}
                className="min-w-0 justify-self-start truncate font-site-sans text-sm font-extralight tracking-[-0.01em] text-[var(--site-ink)] transition-colors hover:text-[var(--site-accent)] md:text-base"
              >
                {SITE_HEADER_NAME}
              </Link>

              <div
                id={SITE_LOGO_HEADER_ID}
                className="size-14 shrink-0 md:size-16"
                aria-hidden
              />

              <button
                type="button"
                tabIndex={visible ? 0 : -1}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
                onClick={() => setMenuOpen(true)}
                className="justify-self-end font-site-sans text-sm font-extralight tracking-[-0.01em] text-[var(--site-ink)] transition-colors hover:text-[var(--site-accent)] md:text-base"
              >
                Menü
              </button>
            </div>
          </nav>
        </div>
      </header>

      <SiteLogoFlight hidden={menuOpen} onProgress={handleProgress} />
      <SiteMenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
