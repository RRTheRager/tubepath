"use client";

import type { BreakdownFetchStatus, StudioAnalytics, StudioBreakdownRow } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataNotice } from "@/components/ui/DataNotice";
import { formatCompact, formatDuration } from "@/lib/utils";

function periodLabel(days: number) {
  return `the last ${days} day${days === 1 ? "" : "s"}`;
}

function BreakdownList({
  rows,
  title,
  status = "ok",
}: {
  rows: StudioBreakdownRow[];
  title: string;
  status?: BreakdownFetchStatus;
}) {
  if (status === "error") {
    return (
      <Card className="p-6">
        <CardHeader title={title} />
        <p className="text-sm text-muted-foreground">
          This breakdown couldn&apos;t be loaded from YouTube right now. Your
          headline metrics above are still accurate.
        </p>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card className="p-6">
        <CardHeader title={title} />
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} data for this period yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader title={title} />
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="min-w-0 break-words font-medium leading-snug">
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.pct}% · {formatCompact(row.views)} views
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
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
  unavailable,
}: {
  label: string;
  value: string;
  hint?: string;
  unavailable?: boolean;
}) {
  return (
    <div className="surface-stat px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-medium tracking-tight tabular-nums ${
          unavailable ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function PeriodBanner({ days, views }: { days: number; views: number }) {
  if (views > 0) return null;
  return (
    <DataNotice
      title="No activity in this period"
      description={`There were no views in ${periodLabel(days)}. Metrics will appear once your channel gets traffic — try a longer range if you recently started uploading.`}
    />
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
  const noActivity = t.views === 0;

  if (tab === "reach") {
    const ctrUnavailable = t.impressions === 0;
    return (
      <div className="space-y-4">
        <PeriodBanner days={studio.periodDays} views={t.views} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Views"
            value={noActivity ? "—" : formatCompact(t.views)}
            unavailable={noActivity}
          />
          <MetricTile
            label="Impressions"
            value={t.impressions > 0 ? formatCompact(t.impressions) : "—"}
            hint={
              t.impressions === 0 && t.views > 0
                ? "Impressions aren't available for all traffic types."
                : undefined
            }
            unavailable={t.impressions === 0}
          />
          <MetricTile
            label="Impressions click-through rate"
            value={ctrUnavailable ? "—" : `${t.ctr.toFixed(2)}%`}
            hint={
              ctrUnavailable
                ? "CTR needs impression data from YouTube."
                : undefined
            }
            unavailable={ctrUnavailable}
          />
        </div>
        <BreakdownList
          rows={studio.trafficSources}
          title="Traffic sources"
          status={studio.breakdownStatus?.traffic}
        />
      </div>
    );
  }

  if (tab === "engagement") {
    return (
      <div className="space-y-4">
        <PeriodBanner days={studio.periodDays} views={t.views} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Watch time (hours)"
            value={noActivity ? "—" : `${formatCompact(t.watchTimeHours)} hrs`}
            unavailable={noActivity}
          />
          <MetricTile
            label="Average view duration"
            value={
              noActivity ? "—" : formatDuration(t.avgViewDurationSeconds)
            }
            unavailable={noActivity}
          />
          <MetricTile
            label="Average percentage viewed"
            value={
              noActivity ? "—" : `${t.avgViewPercentage.toFixed(1)}%`
            }
            unavailable={noActivity}
          />
          <MetricTile
            label="Likes"
            value={noActivity ? "—" : formatCompact(t.likes)}
            unavailable={noActivity}
          />
          <MetricTile
            label="Comments"
            value={noActivity ? "—" : formatCompact(t.comments)}
            unavailable={noActivity}
          />
          <MetricTile
            label="Shares"
            value={noActivity ? "—" : formatCompact(t.shares)}
            unavailable={noActivity}
          />
        </div>
      </div>
    );
  }

  if (tab === "audience") {
    const netSubs = t.subscribersGained - t.subscribersLost;

    return (
      <div className="space-y-4">
        <PeriodBanner days={studio.periodDays} views={t.views} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <MetricTile
              label="Subscribers gained"
              value={noActivity ? "—" : `+${formatCompact(t.subscribersGained)}`}
              unavailable={noActivity}
            />
            <MetricTile
              label="Subscribers lost"
              value={noActivity ? "—" : `-${formatCompact(t.subscribersLost)}`}
              unavailable={noActivity}
            />
            <MetricTile
              label="Net subscribers"
              value={noActivity ? "—" : formatCompact(netSubs)}
              unavailable={noActivity}
            />
          </div>
          <BreakdownList
            rows={studio.devices}
            title="How viewers find you — devices"
            status={studio.breakdownStatus?.devices}
          />
          <BreakdownList
            rows={studio.countries}
            title="Top geographies"
            status={studio.breakdownStatus?.countries}
          />
        </div>
      </div>
    );
  }

  if (tab === "revenue") {
    if (!studio.monetized || studio.breakdownStatus?.revenue === "error") {
      return (
        <Card className="p-8">
          <DataNotice
            variant="locked"
            title="Not monetized"
            description="Estimated revenue, RPM, and playback-based CPM appear here once your channel is in the YouTube Partner Program and YouTube reports earnings for this period."
          />
        </Card>
      );
    }
    const r = studio.revenue!;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Estimated revenue" value={`$${r.estimatedRevenue.toFixed(2)}`} />
        <MetricTile label="Estimated ad revenue" value={`$${r.estimatedAdRevenue.toFixed(2)}`} />
        <MetricTile
          label="RPM"
          value={r.rpm > 0 ? `$${r.rpm.toFixed(2)}` : "$0.00"}
        />
        <MetricTile
          label="Playback-based CPM"
          value={r.playbackCpm > 0 ? `$${r.playbackCpm.toFixed(2)}` : "$0.00"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PeriodBanner days={studio.periodDays} views={t.views} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Views"
          value={noActivity ? "—" : formatCompact(t.views)}
          unavailable={noActivity}
        />
        <MetricTile
          label="Watch time (hours)"
          value={noActivity ? "—" : `${formatCompact(t.watchTimeHours)} hrs`}
          unavailable={noActivity}
        />
        <MetricTile
          label="Net subscribers"
          value={
            noActivity
              ? "—"
              : formatCompact(t.subscribersGained - t.subscribersLost)
          }
          unavailable={noActivity}
        />
        <MetricTile
          label="Impressions click-through rate"
          value={t.impressions > 0 ? `${t.ctr.toFixed(2)}%` : "—"}
          hint={t.impressions === 0 ? "Needs impression data." : undefined}
          unavailable={t.impressions === 0}
        />
      </div>
    </div>
  );
}
