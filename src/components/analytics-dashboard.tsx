"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  generateAnalyticsBriefAction,
  getAnalyticsOverviewAction,
  getAttentionQueueAction,
  getContentPerformanceAction,
  syncAnalyticsAction,
} from "@/app/(dashboard)/analytics/actions";
import { Button } from "@/components/ui/button";
import { listContentSeoEntities } from "@/lib/seo/entity-registry";

type Overview = Awaited<ReturnType<typeof getAnalyticsOverviewAction>>;
type Performance = Awaited<ReturnType<typeof getContentPerformanceAction>>;
type Attention = Awaited<ReturnType<typeof getAttentionQueueAction>>;

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+∞" : "0%";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-muted-foreground text-xs">0</span>;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs ${up ? "text-emerald-600" : "text-rose-600"}`}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {up ? "+" : ""}
      {delta}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="bg-muted h-8 w-full rounded" />;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 120;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full text-foreground/70" preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
}

const kindLabel: Record<string, string> = {
  quiet: "Quiet",
  rising: "Rising",
  falling: "Falling",
  landing: "Landing",
  exit: "Exit",
  ai: "AI",
};

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<Performance>([]);
  const [attention, setAttention] = useState<Attention | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const collections = useMemo(() => listContentSeoEntities(), []);

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const [ov, perf, att] = await Promise.all([
          getAnalyticsOverviewAction(),
          getContentPerformanceAction(filter || undefined),
          getAttentionQueueAction(),
        ]);
        setOverview(ov);
        setRows(perf);
        setAttention(att);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      }
    });
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const quiet = rows.filter((r) => r.pageviews <= 2).slice(0, 6);
  const rising = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const falling = [...rows]
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Which CMS content is working, what&apos;s stuck, and what to edit next — mapped from
            GA4 to your entities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await syncAnalyticsAction(
                  !overview?.connection.connected || !overview.connection.propertyId
                );
                if (!result.ok) setError(result.error ?? "Sync failed");
                else setMessage(`Synced ${result.pageRows} paths (${result.mode}).`);
                load();
              });
            }}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Sync
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await generateAnalyticsBriefAction();
                setMessage(result.summary.slice(0, 120) + (result.summary.length > 120 ? "…" : ""));
                load();
              });
            }}
          >
            <Sparkles className="size-3.5" />
            Refresh insights
          </Button>
          <Link
            href="/settings?section=integrations"
            className="text-muted-foreground hover:text-foreground inline-flex h-8 items-center rounded-lg px-3 text-sm"
          >
            Integrations
          </Link>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {/* Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Sessions (7d)",
            value: overview?.sessions7d ?? "—",
            change: overview
              ? pctChange(overview.sessions7d, overview.sessionsPrev7d)
              : null,
          },
          {
            label: "Users (7d)",
            value: overview?.users7d ?? "—",
            change: overview ? pctChange(overview.users7d, overview.usersPrev7d) : null,
          },
          {
            label: "Pageviews (7d)",
            value: overview?.pageviews7d ?? "—",
            change: overview
              ? pctChange(overview.pageviews7d, overview.pageviewsPrev7d)
              : null,
          },
          {
            label: "Engagement",
            value:
              overview != null
                ? `${(overview.engagementRate7d * 100).toFixed(0)}%`
                : "—",
            change: null,
          },
        ].map((metric) => (
          <div key={metric.label} className="border-border/80 space-y-2 border-b pb-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{metric.label}</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{metric.value}</p>
            {metric.change ? (
              <p className="text-muted-foreground text-xs">vs prior week {metric.change}</p>
            ) : null}
          </div>
        ))}
      </section>

      {overview?.sparkline?.length ? (
        <div className="max-w-sm">
          <p className="text-muted-foreground mb-1 text-xs">Sessions sparkline</p>
          <Sparkline values={overview.sparkline.map((d) => d.sessions)} />
        </div>
      ) : null}

      {!overview?.connection.connected ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
          Google Analytics is not connected.{" "}
          <Link
            href="/settings?section=integrations"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Connect in Settings
          </Link>{" "}
          or run <strong>Sync</strong> for demo data from your CMS content.
        </p>
      ) : null}

      {/* Attention queue */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Attention queue</h2>
          <p className="text-muted-foreground text-sm">
            Do this next — jump straight into the editor.
          </p>
          {attention?.briefSummary ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed">{attention.briefSummary}</p>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(attention?.cards ?? []).map((card) => (
            <div
              key={card.id}
              className="border-border/70 flex flex-col gap-2 border-l-2 py-2 pl-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                  {kindLabel[card.kind] ?? card.kind}
                </span>
                {card.kind === "rising" ? (
                  <TrendingUp className="size-3 text-emerald-600" />
                ) : null}
                {card.kind === "falling" ? (
                  <TrendingDown className="size-3 text-rose-600" />
                ) : null}
              </div>
              <p className="text-sm font-medium">{card.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{card.reason}</p>
              {card.editHref ? (
                <Link
                  href={card.editHref}
                  className="inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
                >
                  Open in editor <ExternalLink className="size-3" />
                </Link>
              ) : null}
            </div>
          ))}
          {!attention?.cards?.length && !pending ? (
            <p className="text-muted-foreground text-sm">
              Sync data, then refresh insights to fill the queue.
            </p>
          ) : null}
        </div>
      </section>

      {/* Quiet / movers */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Published but quiet</h3>
          <ul className="space-y-2">
            {quiet.map((r) => (
              <li key={r.path} className="text-sm">
                {r.editHref ? (
                  <Link href={r.editHref} className="hover:underline">
                    {r.title}
                  </Link>
                ) : (
                  r.title
                )}
                <span className="text-muted-foreground ml-2 text-xs">{r.pageviews} views</span>
              </li>
            ))}
            {!quiet.length ? (
              <li className="text-muted-foreground text-xs">None in this window.</li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rising</h3>
          <ul className="space-y-2">
            {rising.map((r) => (
              <li key={r.path} className="flex items-center justify-between gap-2 text-sm">
                {r.editHref ? (
                  <Link href={r.editHref} className="truncate hover:underline">
                    {r.title}
                  </Link>
                ) : (
                  <span className="truncate">{r.title}</span>
                )}
                <DeltaBadge delta={r.delta} />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Falling</h3>
          <ul className="space-y-2">
            {falling.map((r) => (
              <li key={r.path} className="flex items-center justify-between gap-2 text-sm">
                {r.editHref ? (
                  <Link href={r.editHref} className="truncate hover:underline">
                    {r.title}
                  </Link>
                ) : (
                  <span className="truncate">{r.title}</span>
                )}
                <DeltaBadge delta={r.delta} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Content board */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">Content performance</h2>
            <p className="text-muted-foreground text-sm">CMS items with traffic in the last 7 days.</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-xs uppercase tracking-wide">
                <th className="py-2 pr-3 font-medium">Content</th>
                <th className="py-2 pr-3 font-medium">Views</th>
                <th className="py-2 pr-3 font-medium">Δ</th>
                <th className="py-2 pr-3 font-medium">Eng. (s)</th>
                <th className="py-2 pr-3 font-medium">Bounce</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.path} className="border-border/50 border-b">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {r.entityType ?? "unmapped"} · {r.path}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{r.pageviews}</td>
                  <td className="py-2.5 pr-3">
                    <DeltaBadge delta={r.delta} />
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {Math.round(r.avgEngagementSec)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {(r.bounceRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5">
                    {r.editHref ? (
                      <Link
                        href={r.editHref}
                        className="inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                      >
                        Edit <ExternalLink className="size-3" />
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !pending ? (
            <p className="text-muted-foreground mt-4 text-sm">No mapped content stats yet. Run Sync.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
