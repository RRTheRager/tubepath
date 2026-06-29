import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { getDataProvider } from "@/lib/data/provider";

const ACTIONS = ["update_title", "update_description", "update_tags"] as const;
type ActionName = (typeof ACTIONS)[number];

/** Executes a chatbot tool-call AFTER the user has confirmed it. */
export async function POST(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: ActionName;
    args?: Record<string, unknown>;
  };

  if (!body.name || !ACTIONS.includes(body.name)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const args = body.args ?? {};
  const videoId = String(args.videoId ?? "");
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const provider = await getDataProvider(account);

  const patch: { title?: string; description?: string; tags?: string[] } = {};
  if (body.name === "update_title") {
    const title = String(args.title ?? "").trim();
    if (!title || title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 1–100 characters" },
        { status: 400 }
      );
    }
    patch.title = title;
  }
  if (body.name === "update_description")
    patch.description = String(args.description ?? "");
  if (body.name === "update_tags") {
    const tags = Array.isArray(args.tags)
      ? (args.tags as string[]).map((t) => String(t).trim()).filter(Boolean)
      : [];
    if (tags.length > 500) {
      return NextResponse.json({ error: "Too many tags" }, { status: 400 });
    }
    patch.tags = tags;
  }

  const updated = await provider.updateVideo(videoId, patch);
  if (!updated) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const resultText =
    body.name === "update_title"
      ? `Updated the title to "${updated.title}".`
      : body.name === "update_description"
        ? `Updated the description on "${updated.title}".`
        : `Applied ${patch.tags?.length ?? 0} tags to "${updated.title}".`;

  return NextResponse.json({ actionResult: resultText, video: updated });
}
