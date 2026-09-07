"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { SITE_IMAGES } from "@/website/tragwerker/images";
import { SITE_LOGO_HEADER_ID, SITE_LOGO_HERO_ID } from "@/website/tragwerker/lib/logo";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

type SiteLogoFlightProps = {
  hidden?: boolean;
  onProgress?: (t: number) => void;
};

/** Single logo: sits in the home hero, docks into the header on scroll, stays there sitewide. */
export function SiteLogoFlight({ hidden = false, onProgress }: SiteLogoFlightProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const logoRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const sync = useCallback(() => {
    const logo = logoRef.current;
    const headerSlot = document.getElementById(SITE_LOGO_HEADER_ID);
    if (!logo || !headerSlot) return;

    const dest = headerSlot.getBoundingClientRect();
    const isHome = pathname === "/";
    const heroSlot = isHome ? document.getElementById(SITE_LOGO_HERO_ID) : null;
    const origin = heroSlot?.getBoundingClientRect();
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const canFly = Boolean(origin && origin.width > 0 && desktop);
    const scrollY = window.scrollY || window.pageYOffset;

    let t = 1;
    if (isHome) {
      if (canFly && origin) {
        const distance = Math.max(origin.top + scrollY - dest.top, 1);
        t = clamp(scrollY / distance, 0, 1);
      } else {
        t = clamp(scrollY / Math.max(window.innerHeight * 0.4, 1), 0, 1);
      }
      if (reduceMotion) t = t > 0.15 ? 1 : 0;
      else t = smoothstep(t);
    }

    const left = origin && canFly ? lerp(origin.left, dest.left, t) : dest.left;
    const top = origin && canFly ? lerp(origin.top, dest.top, t) : dest.top;
    const width = origin && canFly ? lerp(origin.width, dest.width, t) : dest.width;
    const height = origin && canFly ? lerp(origin.height, dest.height, t) : dest.height;
    const hideUntilDocked = isHome && !canFly && t < 0.92;

    logo.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    logo.style.width = `${width}px`;
    logo.style.height = `${height}px`;
    logo.style.opacity = hidden || hideUntilDocked ? "0" : "1";
    onProgressRef.current?.(t);
  }, [pathname, reduceMotion, hidden]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(sync);
    };

    sync();
    const boot = window.setTimeout(sync, 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const headerSlot = document.getElementById(SITE_LOGO_HEADER_ID);
    const heroSlot = document.getElementById(SITE_LOGO_HERO_ID);
    const observer = new ResizeObserver(onScroll);
    if (headerSlot) observer.observe(headerSlot);
    if (heroSlot) observer.observe(heroSlot);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(boot);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, [sync]);

  return (
    <div
      ref={logoRef}
      className="pointer-events-none fixed left-0 top-0 z-[51] opacity-0 will-change-transform"
      style={{ width: 56, height: 56 }}
    >
      <Link
        href="/"
        className="pointer-events-auto block size-full"
        aria-label="Die Tragwerker GmbH — zur Startseite"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SITE_IMAGES.logoMark}
          alt=""
          className="size-full object-contain"
          draggable={false}
        />
      </Link>
    </div>
  );
}
