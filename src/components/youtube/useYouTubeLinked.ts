"use client";

import { useSession } from "@/components/providers/SessionProvider";

export function useYouTubeLinked() {
  const { data, loading } = useSession();
  const hasGoogle =
    (data?.googleAccounts?.length ?? 0) > 0 || !!data?.account.youtubeConnected;
  const hasChannel = !!data?.account.youtubeChannelId;

  return {
    loading,
    hasGoogle,
    hasChannel,
    canLoadData: hasGoogle && hasChannel,
    youtubeConfigured: data?.youtubeConfigured ?? false,
  };
}
