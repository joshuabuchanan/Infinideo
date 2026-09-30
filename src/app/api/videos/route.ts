import { NextResponse } from "next/server";

import { devFeedVideos, type FeedVideo } from "@/lib/feed-videos";
import { getFreeVideoPool } from "@/lib/free-video-feed";
import { openFeedVideos } from "@/lib/open-feed-videos";
import { getVideoCatalogItem, searchVideoCatalogPage } from "@/lib/video-catalog";
import type { NormalizedVideo } from "@/lib/video-sources";

const fallbackCatalog: FeedVideo[] = [
  ...devFeedVideos,
  ...openFeedVideos,
  ...getFreeVideoPool(),
];

function isYouTubeFallbackVideo(video: FeedVideo) {
  return video.sourceId === "youtube" || (!video.sourceId && /^[A-Za-z0-9_-]{11}$/.test(video.id));
}

function toCatalogFeedVideo(item: NormalizedVideo): FeedVideo {
  return {
    id: item.id,
    sourceId:
      item.source === "wikimedia"
        ? "wikimedia"
        : item.source === "blender"
          ? "blender"
          : item.source === "dailymotion"
            ? "dailymotion"
            : item.source === "ihavenotv"
              ? "ihavenotv"
              : item.source,
    title: item.title,
    channelTitle: item.creator ?? "Open media",
    thumbnail: item.thumbnailUrl ?? "https://images.unsplash.com/...",
    publishedAt: item.publishedAt ?? "",
    viewCount: String(item.viewCount ?? 0),
    duration: item.duration ? `PT${Math.floor(item.duration / 3600)}H${Math.floor((item.duration % 3600) / 60)}M${item.duration % 60}S` : "PT0S",
    category: item.category,
    creator: item.creator,
    license: item.license,
    licenseUrl: item.licenseUrl,
    sourceName: item.source,
    sourceUrl: item.sourceUrl,
    thumbnailAttribution: item.thumbnailAttribution,
    videoUrl: item.videoUrl,
    embedUrl: item.embedUrl,
    description: item.description,
    channelId: item.channelId,
    creatorUrl: item.creatorUrl,
  };
}

function getLimit(value: string | null) {
  const limit = Number(value ?? 12);
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 48) : 12;
}

function getDurationSeconds(value: string) {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function isShortFormVideo(video: FeedVideo) {
  const duration = getDurationSeconds(video.duration);
  return duration > 0 && duration <= 60;
}

function normalizeCategory(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesCategory(
  video: { category?: string; title: string; description?: string; creator?: string; channelTitle?: string },
  category: string | null,
) {
  if (!category?.trim()) return true;

  const selectedValue = normalizeCategory(category);
  const videoValue = normalizeCategory(video.category ?? "");
  const contentValue = normalizeCategory(
    `${video.title} ${video.description ?? ""} ${video.creator ?? ""} ${video.channelTitle ?? ""}`,
  );

  const matchesMetadata = Boolean(videoValue) && (
    videoValue === selectedValue
    || videoValue.includes(selectedValue)
    || selectedValue.includes(videoValue)
  );

  return matchesMetadata
    || contentValue.includes(selectedValue);
}

function fallbackVideos(query: string | null, category: string | null, currentVideoId?: string) {
  const searchTerms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const filtered = searchTerms.length > 0
    ? fallbackCatalog.filter((video) => {
        const haystack = `${video.title} ${video.channelTitle} ${video.creator ?? ""} ${video.category ?? ""} ${video.description ?? ""}`.toLowerCase();
        return searchTerms.every((term) => haystack.includes(term));
      })
    : fallbackCatalog;

  return filtered
    .filter((video) => matchesCategory(video, category))
    .filter((video) => !currentVideoId || video.id !== currentVideoId);
}

function paginateFallbackVideos(query: string | null, category: string | null, page: number, limit: number) {
  const videos = fallbackVideos(query, category);
  const start = Math.max(page - 1, 0) * limit;
  const items = videos.slice(start, start + limit);

  return {
    videos: items,
    hasMore: start + limit < videos.length,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = getLimit(searchParams.get("limit"));
  const query = searchParams.get("q");
  const channelId = searchParams.get("channelId") ?? undefined;
  const videoId = searchParams.get("videoId");
  const recommendFor = searchParams.get("recommendFor");
  const source = searchParams.get("source") as "youtube" | "twitch" | "pexels" | "pixabay" | "nasa" | "wikimedia" | "internet-archive" | "peertube" | "dailymotion" | "blender" | "ihavenotv" | "all" | null;
  const category = searchParams.get("category");
  const shortForm = searchParams.get("shortForm") === "true";
  const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const hasYoutubeKey = Boolean(process.env.YOUTUBE_API_KEY);

  try {
    if (source === "ihavenotv") {
      return NextResponse.json({ videos: [], hasMore: false, source: "disabled-source" });
    }

    if (channelId && !hasYoutubeKey) {
      return NextResponse.json({ videos: [], hasMore: false, source: "youtube-key-required" });
    }

    if (source === "youtube" && !hasYoutubeKey && !channelId) {
      const youtubeFallback = fallbackCatalog
        .filter(isYouTubeFallbackVideo)
        .filter((video) => !shortForm || isShortFormVideo(video));
      const start = Math.max(page - 1, 0) * limit;
      const items = youtubeFallback.slice(start, start + limit);

      return NextResponse.json({
        videos: items,
        hasMore: start + limit < youtubeFallback.length,
        source: "development-fallback",
      });
    }

    if (videoId) {
      const catalogVideo = await getVideoCatalogItem(videoId, source && source !== "all" ? source : undefined);
      if (catalogVideo) {
        return NextResponse.json({
          videos: [toCatalogFeedVideo(catalogVideo)],
          hasMore: false,
          source: "multi-source-catalog",
        });
      }

      return NextResponse.json({
        videos: fallbackCatalog.filter((video) => video.id === videoId || video.sourceName === videoId),
        hasMore: false,
        source: "development-fallback",
      });
    }

    if (recommendFor) {
      const catalog = await searchVideoCatalogPage({
        q: query ?? category ?? undefined,
        channelId,
        source: source ?? "all",
        category: category ?? undefined,
        limit,
        pageToken,
      });
      const videos = catalog.videos
        .filter((video) => matchesCategory(video, category))
        .filter((video) => !shortForm || (video.duration !== undefined && video.duration > 0 && video.duration <= 60));
      return NextResponse.json({
        videos: videos.map(toCatalogFeedVideo),
        nextPageToken: catalog.nextPageToken,
        hasMore: catalog.hasMore,
        source: videos.length ? "multi-source-catalog" : "development-fallback",
      });
    }

    const catalog = await searchVideoCatalogPage({
      q: query ?? category ?? undefined,
      channelId,
      source: source ?? "all",
      category: category ?? undefined,
      limit,
      pageToken,
    });
    const videos = catalog.videos
      .filter((video) => matchesCategory(video, category))
      .filter((video) => !shortForm || (video.duration !== undefined && video.duration > 0 && video.duration <= 60));

    if (videos.length || pageToken) {
      return NextResponse.json({
        videos: videos.map(toCatalogFeedVideo),
        nextPageToken: catalog.nextPageToken,
        hasMore: catalog.hasMore,
        source: "multi-source-catalog",
      });
    }

    const fallbackResult = paginateFallbackVideos(query, category, page, limit);
    if (shortForm) {
      const shortVideos = fallbackVideos(query, category).filter(isShortFormVideo);
      const start = Math.max(page - 1, 0) * limit;
      const items = shortVideos.slice(start, start + limit);
      return NextResponse.json({
        videos: items,
        hasMore: start + limit < shortVideos.length,
        source: "development-fallback",
      });
    }
    return NextResponse.json({
      ...fallbackResult,
      source: "development-fallback",
    });
  } catch (error) {
    console.error("Unable to load multi-source catalogue", error);
    const fallbackResult = paginateFallbackVideos(query, category, page, limit);
    return NextResponse.json({
      ...fallbackResult,
      source: "development-fallback",
    });
  }
}
