"use client";

import { Check } from "lucide-react";

import type { SeoCheck, SeoScoreResult, SeoWarning } from "@/lib/seo/score";
import { cn } from "@/lib/utils";

type SeoScoreOverviewProps = {
  result: SeoScoreResult;
  className?: string;
};

const RING_SIZE = 88;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score }: { score: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="relative size-[88px] shrink-0">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-black/[0.06]"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-foreground transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {score}
        </span>
        <span className="text-[10px] font-medium tracking-wide text-foreground/40 uppercase">
          / 100
        </span>
      </div>
    </div>
  );
}

function ChecklistRow({ check }: { check: SeoCheck }) {
  const pass = check.status === "pass";

  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          pass
            ? "border-foreground/15 bg-foreground text-background"
            : "border-black/10 bg-transparent"
        )}
        aria-hidden
      >
        {pass ? <Check className="size-2.5 stroke-[3]" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] leading-snug",
            pass ? "text-foreground/55" : "text-foreground"
          )}
        >
          {check.label}
        </p>
        {!pass ? (
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">{check.hint}</p>
        ) : null}
      </div>
    </li>
  );
}

function WarningsList({ warnings }: { warnings: SeoWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="border-t border-black/[0.06] pt-4">
      <p className="text-[11px] font-medium tracking-[0.06em] text-foreground/40 uppercase">
        Suggestions
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {warnings.map((warning) => (
          <li
            key={warning.id}
            className="flex items-center gap-2 text-[13px] text-foreground/75 before:size-1 before:shrink-0 before:rounded-full before:bg-foreground/25 before:content-['']"
          >
            {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SeoScoreOverview({ result, className }: SeoScoreOverviewProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-4",
        className
      )}
    >
      <div className="flex items-center gap-5">
        <ScoreRing score={result.score} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[15px] font-semibold tracking-tight">SEO score</p>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            {result.passedCount} of {result.totalChecks} checks complete
          </p>
        </div>
      </div>

      <ul className="mt-4 border-t border-black/[0.06] pt-3">
        {result.checks.map((check) => (
          <ChecklistRow key={check.id} check={check} />
        ))}
      </ul>

      <WarningsList warnings={result.warnings} />
    </div>
  );
}
