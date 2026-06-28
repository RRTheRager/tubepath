import { NextResponse } from "next/server";
import { getDemoVideos } from "@/lib/demo-data";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const tier = session?.tier ?? "free";
  const video = getDemoVideos().find((v) => v.id === id) ?? getDemoVideos()[0];
  return NextResponse.json({ video, tier });
}
