"use client";

import { useEffect, useRef } from "react";

/** Keep the final value accessible and visible without JavaScript. */
export function SiteCountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    const match = value.match(/^([\d.]+)(\+?)$/);
    if (!element || !match) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window)) return;

    const target = Number(match[1].replaceAll(".", ""));
    if (!Number.isFinite(target)) return;
    const formatter = new Intl.NumberFormat("de-DE");
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1600, 1);
        element.textContent = progress === 1 ? value :
          formatter.format(Math.round(target * (1 - (1 - progress) ** 3))) + match[2];
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    observer.observe(element);

    const finish = () => {
      if (!motion.matches) return;
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = value;
    };
    motion.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
      element.textContent = value;
    };
  }, [value]);

  return (
    <span className="inline-grid tabular-nums">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">{value}</span>
      <span className="sr-only">{value}</span>
      <span ref={ref} className="col-start-1 row-start-1" aria-hidden="true">{value}</span>
    </span>
  );
}
