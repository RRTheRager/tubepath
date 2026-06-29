"use client";

import type { StudioAnalytics, StudioBreakdownRow } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCompact, formatDuration } from "@/lib/utils";

function BreakdownList({ rows, title }: { rows: StudioBreakdownRow[]; title: string }) {
  if (!rows.length) {
    return (
      <Card className="p-4">
        <CardHeader title={title} />
        <p className="text-sm text-muted-foreground">No data for this period yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader title={title} />
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.pct}% · {formatCompact(row.views)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${Math.max(row.pct, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-stat p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StudioAnalyticsPanel({
  studio,
  tab,
}: {
  studio: StudioAnalytics;
  tab: "overview" | "reach" | "engagement" | "audience" | "revenue";
}) {
  const t = studio.totals;

  if (tab === "reach") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile label="Views" value={formatCompact(t.views)} />
        <MetricTile label="Impressions" value={formatCompact(t.impressions)} />
        <MetricTile label="CTR" value={`${t.ctr.toFixed(2)}%`} />
        <div className="sm:col-span-2 lg:col-span-3">
          <BreakdownList rows={studio.trafficSources} title="Traffic sources" />
        </div>
      </div>
    );
  }

  if (tab === "engagement") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile label="Watch time" value={`${formatCompact(t.watchTimeHours)} hrs`} />
        <MetricTile
          label="Avg view duration"
          value={formatDuration(t.avgViewDurationSeconds)}
        />
        <MetricTile label="Avg % viewed" value={`${t.avgViewPercentage.toFixed(1)}%`} />
        <MetricTile label="Likes" value={formatCompact(t.likes)} />
        <MetricTile label="Comments" value={formatCompact(t.comments)} />
        <MetricTile label="Shares" value={formatCompact(t.shares)} />
      </div>
    );
  }

  if (tab === "audience") {
    const netSubs = t.subscribersGained - t.subscribersLost;
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <MetricTile label="Subs gained" value={`+${formatCompact(t.subscribersGained)}`} />
          <MetricTile label="Subs lost" value={`-${formatCompact(t.subscribersLost)}`} />
          <MetricTile label="Net subscribers" value={formatCompact(netSubs)} />
        </div>
        <BreakdownList rows={studio.devices} title="Devices" />
        <BreakdownList rows={studio.countries} title="Top geographies" />
      </div>
    );
  }

  if (tab === "revenue") {
    if (!studio.monetized || !studio.revenue) {
      return (
        <Card className="p-6 text-center">
          <p className="font-medium">Your channel is not monetized</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenue, RPM, and CPM appear here once YouTube Partner Program
            earnings are available for this channel.
          </p>
        </Card>
      );
    }
    const r = studio.revenue;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Estimated revenue" value={`$${r.estimatedRevenue.toFixed(2)}`} />
        <MetricTile label="Ad revenue" value={`$${r.estimatedAdRevenue.toFixed(2)}`} />
        <MetricTile label="RPM" value={`$${r.rpm.toFixed(2)}`} />
        <MetricTile label="Playback CPM" value={`$${r.playbackCpm.toFixed(2)}`} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricTile label="Views" value={formatCompact(t.views)} />
      <MetricTile label="Watch time" value={`${formatCompact(t.watchTimeHours)} hrs`} />
      <MetricTile
        label="Net subscribers"
        value={formatCompact(t.subscribersGained - t.subscribersLost)}
      />
      <MetricTile label="CTR" value={`${t.ctr.toFixed(2)}%`} />
    </div>
  );
}
