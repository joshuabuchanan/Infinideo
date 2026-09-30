import { notFound } from "next/navigation";
import { headers } from "next/headers";

import PlayVideo from "@/components/Playvideo/Playvideo";
import Recommended from "@/components/Recommended/Recommended";
import type { FeedVideo } from "@/lib/feed-videos";
import { getVideoCatalogItem } from "@/lib/video-catalog";
import type { NormalizedVideo } from "@/lib/video-sources";

interface VideoPageProps {
  params: Promise<{
    videoId: string;
  }>;
}

function formatRelativeDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Date unknown";

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function toFeedVideo(video: NormalizedVideo): FeedVideo {
  return {
    id: video.id,
    sourceId: video.source,
    title: video.title,
    channelTitle: video.creator ?? "Open media",
    thumbnail: video.thumbnailUrl ?? "",
    publishedAt: video.publishedAt ?? "",
    viewCount: String(video.viewCount ?? 0),
    duration: video.duration ? `PT${Math.floor(video.duration / 3600)}H${Math.floor((video.duration % 3600) / 60)}M${video.duration % 60}S` : "PT0S",
    category: video.category,
    creator: video.creator,
    license: video.license,
    licenseUrl: video.licenseUrl,
    sourceName: video.source,
    sourceUrl: video.sourceUrl,
    thumbnailAttribution: video.thumbnailAttribution,
    videoUrl: video.videoUrl,
    embedUrl: video.embedUrl,
    description: video.description,
    channelId: video.channelId,
    creatorUrl: video.creatorUrl,
  };
}

function fallbackVideo(videoId: string): FeedVideo | undefined {
  const dailymotionId = videoId.match(/^dailymotion:([A-Za-z0-9]+)$/)?.[1];
  if (!dailymotionId) return undefined;

  return {
    id: videoId,
    sourceId: "dailymotion",
    title: "Dailymotion video",
    channelTitle: "Dailymotion",
    thumbnail: `https://www.dailymotion.com/thumbnail/video/${dailymotionId}`,
    publishedAt: new Date().toISOString(),
    viewCount: "0",
    duration: "PT0S",
    category: "Video",
    sourceName: "dailymotion",
    sourceUrl: `https://www.dailymotion.com/video/${dailymotionId}`,
    embedUrl: `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(dailymotionId)}`,
  };
}

export default async function VideoPage({
  params,
}: VideoPageProps) {
  const { videoId } = await params;
  let currentVideo: FeedVideo | undefined = fallbackVideo(videoId);

  try {
    const source = videoId.startsWith("dailymotion:") ? "dailymotion" : undefined;
    const catalogVideo = await getVideoCatalogItem(videoId, source);
    if (catalogVideo) {
      currentVideo = toFeedVideo(catalogVideo);
    }

    if (!currentVideo) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const baseUrl = host
      ? `http://${host}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/videos?videoId=${encodeURIComponent(videoId)}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { videos?: FeedVideo[] };
      currentVideo = data.videos?.[0];
    }
    }
  } catch {
    currentVideo = undefined;
  }

  if (!currentVideo) notFound();

  return (
    <main className="play-container min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
          <PlayVideo
            videoId={currentVideo.id}
            title={currentVideo.title}
            channelTitle={currentVideo.channelTitle}
            viewCount={currentVideo.viewCount}
            publishedAt={formatRelativeDate(currentVideo.publishedAt)}
            duration={currentVideo.duration}
            thumbnail={currentVideo.thumbnail}
            videoUrl={currentVideo.videoUrl}
            embedUrl={currentVideo.embedUrl}
            creator={currentVideo.creator}
            license={currentVideo.license}
            licenseUrl={currentVideo.licenseUrl}
            sourceName={currentVideo.sourceName}
            sourceUrl={currentVideo.sourceUrl}
            thumbnailAttribution={currentVideo.thumbnailAttribution}
            sourceId={
              currentVideo.sourceId ??
              (currentVideo.sourceName === "dailymotion"
                ? "dailymotion"
                : currentVideo.sourceName === "ihavenotv"
                  ? "ihavenotv"
                  : currentVideo.sourceName?.toLowerCase().includes("internet archive")
                    ? "internet-archive"
                    : undefined)
            }
          />
          <Recommended currentVideoId={currentVideo.id} />
        </div>
      </div>
    </main>
  );
}