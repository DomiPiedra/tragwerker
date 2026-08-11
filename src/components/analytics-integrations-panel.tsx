"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BarChart3, Link2, Loader2, RefreshCw, Sparkles, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  disconnectAnalyticsAction,
  getAnalyticsConnectionAction,
  listGa4PropertiesAction,
  selectGa4PropertyAction,
  syncAnalyticsAction,
} from "@/app/(dashboard)/analytics/actions";

type Connection = Awaited<ReturnType<typeof getAnalyticsConnectionAction>>;
type Property = { propertyId: string; displayName: string; accountName: string };

export function AnalyticsIntegrationsPanel() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      const status = await getAnalyticsConnectionAction();
      setConnection(status);
      if (status.propertyId) setSelectedProperty(status.propertyId);
      if (status.connected) {
        const listed = await listGa4PropertiesAction();
        if (listed.ok) setProperties(listed.properties);
        else if (listed.error) setError(listed.error);
      }
    });
  }

  useEffect(() => {
    reload();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      setMessage("Google account connected. Select a GA4 property below.");
    }
    const err = params.get("error");
    if (err) setError(decodeURIComponent(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4" />
          Google Analytics 4
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Connect one admin Google account, pick a GA4 property, then sync traffic into CMS
          Analytics. HCMS maps page paths to your content so you edit what matters — not a GA
          clone.
        </p>
      </div>

      {!connection?.oauthConfigured ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-3 text-xs">
          Add <code className="text-foreground">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="text-foreground">GOOGLE_CLIENT_SECRET</code>, and optionally{" "}
          <code className="text-foreground">GOOGLE_REDIRECT_URI</code> /{" "}
          <code className="text-foreground">ANALYTICS_TOKEN_SECRET</code> to{" "}
          <code className="text-foreground">.env.local</code>. Until then you can still use demo
          sync on the Analytics page.
        </p>
      ) : null}

      {connection?.connected ? (
        <div className="space-y-3 rounded-lg border px-3 py-3 text-sm">
          <p>
            Connected as{" "}
            <span className="font-medium">{connection.googleAccountEmail ?? "Google account"}</span>
          </p>
          {connection.propertyDisplayName ? (
            <p className="text-muted-foreground text-xs">
              Property: {connection.propertyDisplayName} ({connection.propertyId})
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">No property selected yet.</p>
          )}
          {connection.lastSyncAt ? (
            <p className="text-muted-foreground text-xs">
              Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : connection?.oauthConfigured ? (
        <a
          href="/api/analytics/google/connect"
          className="bg-primary text-primary-foreground inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:opacity-90"
        >
          <Link2 className="size-3.5" />
          Connect Google
        </a>
      ) : (
        <Button size="sm" disabled>
          <Link2 className="size-3.5" />
          Connect Google
        </Button>
      )}

      {connection?.connected ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">GA4 property</p>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm"
            disabled={pending || properties.length === 0}
          >
            <option value="">Select a property…</option>
            {properties.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>
                {p.accountName} — {p.displayName}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending || !selectedProperty}
              onClick={() => {
                const prop = properties.find((p) => p.propertyId === selectedProperty);
                if (!prop) return;
                startTransition(async () => {
                  setError(null);
                  await selectGa4PropertyAction(prop.propertyId, prop.displayName);
                  setMessage("Property saved. Syncing…");
                  const sync = await syncAnalyticsAction(false);
                  if (!sync.ok) setError(sync.error ?? "Sync failed");
                  else setMessage(`Synced ${sync.pageRows} paths from GA4.`);
                  reload();
                });
              }}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save & sync
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const sync = await syncAnalyticsAction(false);
                  if (!sync.ok) setError(sync.error ?? "Sync failed");
                  else setMessage(`Synced ${sync.pageRows} paths (${sync.mode}).`);
                  reload();
                });
              }}
            >
              <RefreshCw className="size-3.5" />
              Sync now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await disconnectAnalyticsAction();
                  setMessage("Disconnected.");
                  setProperties([]);
                  reload();
                });
              }}
            >
              <Unplug className="size-3.5" />
              Disconnect
            </Button>
          </div>
        </div>
      ) : null}

      <Separator />

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <Sparkles className="size-3.5" />
        Open{" "}
        <Link href="/analytics" className="text-foreground underline-offset-2 hover:underline">
          Analytics
        </Link>{" "}
        for the content performance board and attention queue.
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
