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
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StudioAnalyticsPanel } from "@/components/analytics/StudioAnalyticsPanel";
import { formatCompact } from "@/lib/utils";

type Range = "7" | "28" | "90";
type StudioTab = "overview" | "reach" | "engagement" | "audience" | "revenue";

const STUDIO_TABS: { value: StudioTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "reach", label: "Reach" },
  { value: "engagement", label: "Engagement" },
  { value: "audience", label: "Audience" },
  { value: "revenue", label: "Revenue" },
];

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

      {studio && (
        <section className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card/60 p-1">
              {STUDIO_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStudioTab(tab.value)}
                  className={`tap-target rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    studioTab === tab.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <StudioAnalyticsPanel studio={studio} tab={studioTab} />
        </section>
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
        <div className="py-8 text-center text-sm text-muted-foreground">{data.error}</div>
      ) : (
        <section className="space-y-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <LineChart className="h-5 w-5 text-primary" /> AI analysis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Topic focus: {ctx?.topic || "—"}
            </p>
            {ctx?.thinData && (
              <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Limited analytics history ({ctx.dataDays} days) — insights may not
                be fully accurate yet.
              </p>
            )}
          </div>

          {ctx?.facts && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {ctx.facts.map((f) => (
                <Card key={f.label} className="p-4">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{f.value}</p>
                  {f.delta && (
                    <div className="mt-1">
                      <Delta value={parseFloat(f.delta)} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {brief && (
            <Card>
              <CardHeader
                title="Analysis"
                action={
                  <Badge tone="primary">
                    <Sparkles className="mr-1 h-3 w-3" /> AI
                  </Badge>
                }
              />
              <h3 className="text-lg font-semibold">{brief.headline}</h3>
              {brief.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-2 text-sm text-muted-foreground">
                  {p}
                </p>
              ))}
              {brief.thinDataWarning && (
                <p className="mt-3 text-xs text-warning">{brief.thinDataWarning}</p>
              )}
            </Card>
          )}

          {brief?.comparisons && brief.comparisons.length > 0 && (
            <Card>
              <CardHeader title="Comparisons" />
              <div className="space-y-3">
                {brief.comparisons.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{c.label}</p>
                      {c.source === "public" && (
                        <span className="text-[10px] text-muted-foreground">
                          Public data
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {brief?.citations && brief.citations.length > 0 && (
            <Card>
              <CardHeader title="Cited metrics" />
              <ul className="space-y-1 text-sm text-muted-foreground">
                {brief.citations.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ctx?.competitors && ctx.competitors.length > 0 && (
            <Card>
              <CardHeader title="Competitor benchmarks" />
              <div className="flex flex-wrap gap-2">
                {ctx.competitors.map((c) => (
                  <div
                    key={c.channelTitle}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{c.channelTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCompact(c.subscriberCount)} subs · Public data
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {ctx?.dominantPattern && (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Top video traffic pattern</p>
              <p className="mt-1 font-semibold">{ctx.dominantPattern}</p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
