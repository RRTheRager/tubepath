import { NextResponse } from "next/server";
import { getDemoPipeline } from "@/lib/demo-data";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { parseYouTubeVideoId } from "@tubepath/youtube";

let demoPipeline = getDemoPipeline();

export async function GET() {
  const session = await getSession();
  const tier = session?.tier ?? "free";

  if (tier !== "pro") {
    return NextResponse.json({ tier, nodes: [], edges: [] });
  }

  if (isDemoMode()) {
    return NextResponse.json({ tier, ...demoPipeline });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  if (!supabase || !session?.userId) {
    return NextResponse.json({ tier, ...demoPipeline });
  }

  const { data: nodes } = await supabase
    .from("pipeline_nodes")
    .select("*")
    .eq("user_id", session.userId);

  const { data: edges } = await supabase
    .from("pipeline_edges")
    .select("*")
    .eq("user_id", session.userId);

  return NextResponse.json({
    tier,
    nodes: (nodes ?? []).map((n) => ({
      id: n.id,
      type: n.node_type,
      title: n.title,
      url: n.url,
      thumbnailUrl: n.thumbnail_url,
      notes: n.notes,
      videoId: n.video_id,
      createdAt: n.created_at,
    })),
    edges: (edges ?? []).map((e) => ({
      id: e.id,
      sourceId: e.source_node_id,
      targetId: e.target_node_id,
      type: e.edge_type,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  const tier = session?.tier ?? "free";

  if (tier !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const { url, notes } = (await request.json()) as { url?: string; notes?: string };
  const videoId = url ? parseYouTubeVideoId(url) : null;

  const newNode = {
    id: `pn-${Date.now()}`,
    type: videoId ? ("external_video" as const) : ("note" as const),
    title: videoId ? `Video ${videoId}` : notes ?? "New note",
    url: url ?? undefined,
    thumbnailUrl: videoId
      ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
      : undefined,
    notes,
    createdAt: new Date().toISOString(),
  };

  if (isDemoMode()) {
    demoPipeline = {
      nodes: [...demoPipeline.nodes, newNode],
      edges:
        demoPipeline.nodes.length > 0
          ? [
              ...demoPipeline.edges,
              {
                id: `pe-${Date.now()}`,
                sourceId: demoPipeline.nodes[demoPipeline.nodes.length - 1]!.id,
                targetId: newNode.id,
                type: "inspired_by" as const,
              },
            ]
          : demoPipeline.edges,
    };
    return NextResponse.json({ tier, ...demoPipeline });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  if (!supabase || !session?.userId) {
    return NextResponse.json({ tier, ...demoPipeline });
  }

  const { data: inserted } = await supabase
    .from("pipeline_nodes")
    .insert({
      user_id: session.userId,
      channel_connection_id: session.activeChannelId,
      node_type: newNode.type,
      title: newNode.title,
      url: newNode.url,
      thumbnail_url: newNode.thumbnailUrl,
      notes: newNode.notes,
    })
    .select()
    .single();

  return NextResponse.json({
    tier,
    nodes: [...demoPipeline.nodes, { ...newNode, id: inserted?.id ?? newNode.id }],
    edges: demoPipeline.edges,
  });
}
