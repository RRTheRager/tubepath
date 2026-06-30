import { NextResponse } from "next/server";

import { getCurrentAccount } from "@/lib/session";

import { capabilitiesFor } from "@/lib/access";

import {

  canLoadYouTubeData,

  getDataProvider,

  YouTubeDataError,

  YouTubeNotConnectedError,

} from "@/lib/data/provider";



export async function GET() {

  const account = await getCurrentAccount();

  const caps = capabilitiesFor(account.status);

  if (!caps.canEnterApp) {

    return NextResponse.json({ error: "No active subscription" }, { status: 403 });

  }



  if (!(await canLoadYouTubeData(account))) {

    return NextResponse.json({ youtubeConnected: false, videos: [] });

  }



  try {

    const provider = await getDataProvider(account);

    const videos = await provider.getVideos();

    return NextResponse.json({ youtubeConnected: true, videos });

  } catch (err) {

    if (err instanceof YouTubeNotConnectedError) {

      return NextResponse.json({ youtubeConnected: false, videos: [] });

    }

    if (err instanceof YouTubeDataError) {

      return NextResponse.json(

        { youtubeConnected: true, error: err.message, videos: [] },

        { status: 502 }

      );

    }

    throw err;

  }

}

