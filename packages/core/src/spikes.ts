import type { DailyMetric, MetricAnomaly, MetricKey } from "./types";

const DEFAULT_WINDOW = 7;
const Z_THRESHOLD = 2.0;

export function detectAnomalies(
  series: DailyMetric[],
  metric: MetricKey = "engagement",
  window = DEFAULT_WINDOW,
  threshold = Z_THRESHOLD
): MetricAnomaly[] {
  if (series.length < window + 1) return [];

  const values = series.map((d) => getMetricValue(d, metric));
  const anomalies: MetricAnomaly[] = [];

  for (let i = window; i < values.length; i++) {
    const windowSlice = values.slice(i - window, i);
    const mean = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
    const variance =
      windowSlice.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
      windowSlice.length;
    const std = Math.sqrt(variance) || 1;
    const value = values[i]!;
    const zScore = (value - mean) / std;

    if (Math.abs(zScore) >= threshold) {
      anomalies.push({
        date: series[i]!.date,
        metric,
        value,
        zScore,
        direction: zScore > 0 ? "spike" : "dip",
      });
    }
  }

  return anomalies;
}

function getMetricValue(d: DailyMetric, metric: MetricKey): number {
  switch (metric) {
    case "views":
      return d.views;
    case "subscribers":
      return d.subscribersGained - d.subscribersLost;
    case "likes":
      return d.likes;
    case "comments":
      return d.comments;
    case "engagement":
      return d.engagementRate;
    default:
      return 0;
  }
}

export function latestSpike(
  anomalies: MetricAnomaly[]
): MetricAnomaly | null {
  const spikes = anomalies.filter((a) => a.direction === "spike");
  if (spikes.length === 0) return null;
  return spikes[spikes.length - 1]!;
}

export function formatSpikeTeaser(anomaly: MetricAnomaly): string {
  const date = new Date(anomaly.date);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `Spike on ${formatted} — unlock Pro to explore`;
}
