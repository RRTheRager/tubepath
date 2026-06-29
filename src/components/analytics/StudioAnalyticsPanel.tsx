"use client";

import type { StudioAnalytics, StudioBreakdownRow } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataNotice } from "@/components/ui/DataNotice";
import { formatCompact, formatDuration } from "@/lib/utils";

function periodLabel(days: number) {
  return `the last ${days} day${days === 1 ? "" : "s"}`;
}

function BreakdownList({ rows, title }: { rows: StudioBreakdownRow[]; title: string }) {
  if (!rows.length) {
    return (
      <Card className="p-6">
        <CardHeader title={title} />
        <DataNotice
          className="py-8"
          title="Not enough data yet"
          description={`YouTube hasn't returned ${title.toLowerCase()} breakdowns for this period. Check back after more views accumulate, or try a longer date range.`}
        />
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
        <BreakdownList rows={studio.trafficSources} title="Traffic sources" />
      </div>
    );
  }

  if (tab === "engagement") {
    const noEngagementSignals =
      !noActivity &&
      t.watchTimeHours === 0 &&
      t.likes === 0 &&
      t.comments === 0 &&
      t.shares === 0;

    return (
      <div className="space-y-4">
        <PeriodBanner days={studio.periodDays} views={t.views} />
        {noEngagementSignals && (
          <DataNotice
            title="Limited engagement data"
            description={`Views were recorded in ${periodLabel(studio.periodDays)}, but YouTube hasn't reported watch time or interactions yet. This can lag by a day or two.`}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Watch time (hours)"
            value={noActivity ? "—" : `${formatCompact(t.watchTimeHours)} hrs`}
            unavailable={noActivity}
          />
          <MetricTile
            label="Average view duration"
            value={
              noActivity || t.avgViewDurationSeconds === 0
                ? "—"
                : formatDuration(t.avgViewDurationSeconds)
            }
            unavailable={noActivity || t.avgViewDurationSeconds === 0}
          />
          <MetricTile
            label="Average percentage viewed"
            value={
              noActivity || t.avgViewPercentage === 0
                ? "—"
                : `${t.avgViewPercentage.toFixed(1)}%`
            }
            unavailable={noActivity || t.avgViewPercentage === 0}
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
    const noSubData =
      !noActivity && t.subscribersGained === 0 && t.subscribersLost === 0;

    return (
      <div className="space-y-4">
        <PeriodBanner days={studio.periodDays} views={t.views} />
        {noSubData && (
          <DataNotice
            title="No subscriber changes reported"
            description={`YouTube didn't report subscriber gains or losses in ${periodLabel(studio.periodDays)}. Small channels sometimes see gaps until more activity builds up.`}
          />
        )}
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
          <BreakdownList rows={studio.devices} title="How viewers find you — devices" />
          <BreakdownList rows={studio.countries} title="Top geographies" />
        </div>
      </div>
    );
  }

  if (tab === "revenue") {
    if (!studio.monetized || !studio.revenue) {
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
    const r = studio.revenue;
    const noRevenue = r.estimatedRevenue === 0 && r.estimatedAdRevenue === 0;

    return (
      <div className="space-y-4">
        {noRevenue && (
          <DataNotice
            title="No earnings in this period"
            description={`Your channel is monetized, but YouTube reported $0.00 in ${periodLabel(studio.periodDays)}. Earnings can lag and vary with views, RPM, and ad fill.`}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Estimated revenue" value={`$${r.estimatedRevenue.toFixed(2)}`} />
          <MetricTile label="Estimated ad revenue" value={`$${r.estimatedAdRevenue.toFixed(2)}`} />
          <MetricTile
            label="RPM"
            value={r.rpm > 0 ? `$${r.rpm.toFixed(2)}` : "—"}
            hint={r.rpm <= 0 ? "RPM needs revenue and views in the same period." : undefined}
            unavailable={r.rpm <= 0}
          />
          <MetricTile
            label="Playback-based CPM"
            value={r.playbackCpm > 0 ? `$${r.playbackCpm.toFixed(2)}` : "—"}
            unavailable={r.playbackCpm <= 0}
          />
        </div>
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
