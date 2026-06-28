import { NextResponse } from "next/server";
import {
  getDemoCompetitors,
  getDemoPulseData,
  metricsToChart,
} from "@/lib/demo-data";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { parseYouTubeChannelId } from "@tubepath/youtube";

export async function GET() {
  const session = await getSession();
  const tier = session?.tier ?? "free";

  if (tier !== "pro") {
    return NextResponse.json({ tier, competitors: [] });
  }

  const competitors = getDemoCompetitors();
  const pulse = getDemoPulseData("pro");
  const yourData = metricsToChart(pulse.metrics, "views");
  const competitorData = yourData.map((d) => ({
    ...d,
    value: Math.floor(d.value * (0.7 + Math.random() * 0.6)),
  }));

  return NextResponse.json({
    tier,
    competitors,
    comparison: {
      yourData,
      competitorData,
      competitor: competitors[0],
    },
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  const tier = session?.tier ?? "free";

  if (tier !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const { url } = (await request.json()) as { url: string };
  const channelId = parseYouTubeChannelId(url) ?? url;

  if (isDemoMode()) {
    const competitors = [
      ...getDemoCompetitors(),
      {
        id: `comp-${Date.now()}`,
        youtubeChannelId: channelId,
        nickname: "Added Channel",
        title: "Added Channel",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        subscriberCount: 22000,
      },
    ];
    const pulse = getDemoPulseData("pro");
    return NextResponse.json({
      competitors,
      comparison: {
        yourData: metricsToChart(pulse.metrics, "views"),
        competitorData: metricsToChart(pulse.metrics, "views").map((d) => ({
          ...d,
          value: Math.floor(d.value * 0.85),
        })),
        competitor: competitors[competitors.length - 1],
      },
    });
  }

  return NextResponse.json({ competitors: getDemoCompetitors() });
}
