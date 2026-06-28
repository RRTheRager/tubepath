import { VideoDetailPage } from "./VideosPage";

export default function VideoDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <VideoDetailWrapper params={params} />;
}

async function VideoDetailWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VideoDetailPage videoId={id} />;
}
