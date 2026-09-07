"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { SITE_HEADER_NAME } from "@/website/tragwerker/config";
import { CmsImage } from "@/website/tragwerker/components/cms-image";
import { SITE_IMAGES } from "@/website/tragwerker/images";
import { MAIN_NAV, MENU_FOOTER_NAV } from "@/website/tragwerker/navigation";

export function SiteMenuOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      onClose();
      router.push(`/suche?q=${encodeURIComponent(q)}`);
    },
    [query, onClose, router]
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] overflow-hidden bg-[var(--site-paper)] text-[var(--site-ink)]"
          role="dialog"
          aria-modal="true"
          aria-label="Menü"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0" aria-hidden>
            <CmsImage
              src={SITE_IMAGES.menuBackground}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-[var(--site-paper)]/55" />
          </div>

          <div className="site-container relative flex h-full min-h-svh flex-col py-8 md:py-10">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={onClose}
                className="font-site-sans text-lg font-extralight tracking-[-0.01em] site-link-quiet md:text-xl"
              >
                {SITE_HEADER_NAME}
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="min-h-11 font-site-sans text-base font-extralight tracking-[-0.01em] site-link-quiet"
              >
                Schließen
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-10 md:py-16">
              <nav className="w-full max-w-md space-y-1">
                {MAIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block font-site-sans text-[1.75rem] leading-tight tracking-[-0.02em] site-link-quiet md:text-[2rem]",
                      pathname === item.href && "opacity-50"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <form onSubmit={handleSearch} className="mt-10 w-full max-w-md">
                <label htmlFor="site-search" className="sr-only">
                  Suche
                </label>
                <input
                  id="site-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suche"
                  className="w-full border-b border-[var(--site-line)] bg-transparent py-3 font-site-sans text-base font-extralight outline-none placeholder:text-[var(--site-muted)] md:text-lg"
                />
              </form>
            </div>

            <footer className="mx-auto grid max-w-lg grid-cols-2 gap-10 pb-2 text-center sm:gap-16 md:gap-20">
              {MENU_FOOTER_NAV.map((group) => (
                <div key={group.title}>
                  <p className="font-site-sans text-xs font-extralight uppercase tracking-[0.2em] text-[var(--site-muted)]">{group.title}</p>
                  <ul className="mt-4 space-y-2">
                    {group.links.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "font-site-sans text-sm font-extralight site-link-quiet md:text-base",
                            pathname === item.href && "opacity-50"
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </footer>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
