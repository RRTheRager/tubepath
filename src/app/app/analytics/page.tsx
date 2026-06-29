"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Sparkles, TrendingUp } from "lucide-react";
import type { OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { PremiumGate } from "@/components/access/PremiumGate";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { Delta } from "@/components/ui/Delta";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataNotice } from "@/components/ui/DataNotice";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StudioAnalyticsPanel } from "@/components/analytics/StudioAnalyticsPanel";
import { StudioTabBar, type StudioTab } from "@/components/analytics/StudioTabBar";
import { formatCompact } from "@/lib/utils";

type Range = "7" | "28" | "90";

interface AnalyticsFact {
  label: string;
  value: string;
  delta?: string;
  source: "your_analytics" | "public";
}

interface AnalyticsResponse {
  brief?: {
    headline: string;
    paragraphs: string[];
    comparisons: { label: string; detail: string; source: string }[];
    citations: string[];
    thinDataWarning?: string;
  };
  ctx?: {
    channelTitle: string;
    topic: string;
    thinData: boolean;
    dataDays: number;
    facts: AnalyticsFact[];
    competitors: {
      channelTitle: string;
      subscriberCount: number;
      matchScore: number;
      isPublicData: boolean;
    }[];
    dominantPattern: string;
  };
  error?: string;
}

export default function AnalyticsPage() {
  const { data: session, loading: sessionLoading } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [range, setRange] = useState<Range>("28");
  const [studioTab, setStudioTab] = useState<StudioTab>("overview");
  const [loading, setLoading] = useState(true);

  const caps = session?.capabilities;
  const hasAi = caps?.ai ?? false;

  useEffect(() => {
    if (!hasChannel) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/overview?days=${range}`, { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null
      ),
      hasAi
        ? fetch("/api/ai/analytics", { cache: "no-store" }).then((r) => r.json())
        : Promise.resolve(null),
    ])
      .then(([overviewJson, aiJson]) => {
        if (overviewJson?.youtubeConnected && overviewJson.overview) {
          setOverview(overviewJson.overview);
        } else {
          setOverview(null);
        }
        if (aiJson) setData(aiJson);
      })
      .catch(() => {
        setOverview(null);
        if (hasAi) {
          setData({
            error:
              "This isn't working right now. Please try again or contact support.",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [hasChannel, range, hasAi]);

  const rangeOptions = useMemo(() => {
    const opts: { value: Range; label: string }[] = [
      { value: "7", label: "7 days" },
      { value: "28", label: "28 days" },
    ];
    if ((caps?.historyDays ?? 30) >= 90) opts.push({ value: "90", label: "90 days" });
    return opts;
  }, [caps?.historyDays]);

  if (sessionLoading || ytLoading) return <Loading />;

  if (!hasChannel) {
    return <YouTubeConnectPrompt variant="select-channel" />;
  }

  if (loading || !caps) return <Loading label="Loading analytics" />;

  if (!overview) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        We couldn&apos;t load your channel data right now. Try reconnecting in
        Settings.
      </div>
    );
  }

  const studio = overview.studio;
  const ctx = data?.ctx;
  const brief = data?.brief;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics"
        description={`${overview.channel.title} · ${formatCompact(overview.channel.subscriberCount)} subscribers`}
        action={
          <SegmentedControl options={rangeOptions} value={range} onChange={setRange} />
        }
      />

      {studio ? (
        <section className="space-y-5">
          <StudioTabBar value={studioTab} onChange={setStudioTab} />
          <StudioAnalyticsPanel studio={studio} tab={studioTab} />
        </section>
      ) : (
        <DataNotice
          title="Studio metrics unavailable"
          description="YouTube didn't return detailed analytics for this period. Try a longer date range or reconnect your channel in Settings."
        />
      )}

      {!hasAi ? (
        <PremiumGate
          title="AI Analytics"
          description="Data-driven comparisons and cited insights — no generic advice."
          perks={[
            "Period-over-period comparisons with real numbers",
            "Auto-detected competitor benchmarks (public data)",
            "Traffic pattern analysis tied to your uploads",
            "Thin-data warnings when history is limited",
          ]}
        />
      ) : data?.error && !data.brief ? (
        <DataNotice
          title="AI analysis unavailable"
          description={data.error}
        />
      ) : (
        <section className="space-y-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <LineChart className="h-5 w-5 text-primary" /> AI analysis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Topic focus: {ctx?.topic || "Not enough uploads to detect a topic yet"}
            </p>
            {ctx?.thinData && (
              <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-warning">
                Limited analytics history ({ctx.dataDays} days) — insights may not
                be fully accurate yet.
              </p>
            )}
          </div>

          {ctx?.facts?.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {ctx.facts.map((f) => (
                <Card key={f.label} className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="mt-2 text-xl font-medium tabular-nums">{f.value}</p>
                  {f.delta && (
                    <div className="mt-2">
                      <Delta value={parseFloat(f.delta)} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <DataNotice
              title="Not enough data for key facts"
              description="We need more views and history before the AI can summarize period-over-period changes with confidence."
            />
          )}

          {brief ? (
            <Card className="p-6">
              <CardHeader
                title="Analysis"
                action={
                  <Badge tone="primary">
                    <Sparkles className="mr-1 h-3 w-3" /> AI
                  </Badge>
                }
              />
              <h3 className="text-lg font-semibold leading-snug">{brief.headline}</h3>
              {brief.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {brief.thinDataWarning && (
                <p className="mt-4 text-sm text-warning">{brief.thinDataWarning}</p>
              )}
            </Card>
          ) : (
            <DataNotice
              title="Analysis not ready"
              description="There isn't enough channel data yet to produce a written analysis. Check back after more uploads and views."
            />
          )}

          {brief?.comparisons?.length ? (
            <Card className="p-6">
              <CardHeader title="Comparisons" />
              <div className="space-y-3">
                {brief.comparisons.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{c.label}</p>
                      {c.source === "public" && (
                        <span className="text-xs text-muted-foreground">Public data</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.detail}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : hasAi && brief ? (
            <DataNotice
              title="No comparisons available"
              description="There isn't enough overlapping data to compare against competitors or prior periods yet."
            />
          ) : null}

          {brief?.citations?.length ? (
            <Card className="p-6">
              <CardHeader title="Cited metrics" />
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {brief.citations.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {ctx?.competitors?.length ? (
            <Card className="p-6">
              <CardHeader title="Competitor benchmarks" />
              <div className="flex flex-wrap gap-3">
                {ctx.competitors.map((c) => (
                  <div
                    key={c.channelTitle}
                    className="rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{c.channelTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCompact(c.subscriberCount)} subs · Public data
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : hasAi ? (
            <DataNotice
              title="No competitor benchmarks"
              description="We couldn't find enough similar channels in public data to benchmark against your niche yet."
            />
          ) : null}

          {ctx?.dominantPattern ? (
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Top video traffic pattern
              </p>
              <p className="mt-2 font-semibold">{ctx.dominantPattern}</p>
            </Card>
          ) : hasAi ? (
            <DataNotice
              title="Traffic pattern unknown"
              description="Upload more videos with measurable views before we can identify a dominant traffic source."
            />
          ) : null}
        </section>
      )}
    </div>
  );
}
