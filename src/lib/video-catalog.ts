import { cache } from "react";

import { videoAdapters } from "@/lib/video-adapters";
import type {
  NormalizedVideo,
  VideoSearchOptions,
  VideoSource,
  VideoSearchPage,
} from "@/lib/video-sources";

export type VideoCatalogQuery = VideoSearchOptions & {
  source?: VideoSource | "all";
  page?: number;
};

export const getEnabledVideoSources = (): VideoSource[] => {
  const sources: VideoSource[] = ["youtube", "twitch", "pexels", "pixabay", "nasa", "wikimedia", "internet-archive", "peertube", "dailymotion", "blender"];
  return sources.filter((source) => {
    if (source === "youtube") return Boolean(process.env.YOUTUBE_API_KEY);
    if (source === "twitch") return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
    if (source === "pexels") return Boolean(process.env.PEXELS_API_KEY);
    if (source === "pixabay") return Boolean(process.env.PIXABAY_API_KEY);
    if (source === "nasa") return Boolean(process.env.NASA_API_KEY || process.env.NASA_BASE_URL);
    if (source === "wikimedia") return true;
    if (source === "internet-archive") return true;
    if (source === "peertube") return true;
    if (source === "dailymotion") return true;
    if (source === "blender") return true;
    return true;
  });
};

function dedupeVideos(videos: NormalizedVideo[]) {
  const seen = new Set<string>();
  const unique: NormalizedVideo[] = [];

  for (const video of videos) {
    const key = `${video.source}:${video.sourceVideoId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(video);
  }

  return unique;
}

export function sortVideoSearchResults(videos: NormalizedVideo[], query?: string) {
  const searchTerms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  return [...videos].sort((a, b) => {
    const relevance = (video: NormalizedVideo) => {
      if (searchTerms.length === 0) return 0;

      const title = video.title.toLowerCase();
      const creator = (video.creator ?? "").toLowerCase();
      const searchable = `${title} ${creator} ${(video.description ?? "").toLowerCase()}`;
      const matchedTerms = searchTerms.filter((term) => searchable.includes(term)).length;
      const titleMatches = searchTerms.filter((term) => title.includes(term)).length;
      const creatorMatches = searchTerms.filter((term) => creator.includes(term)).length;
      const exactTitle = title.includes(searchTerms.join(" ")) ? 2 : 0;
      const exactCreator = creator.includes(searchTerms.join(" ")) ? 2 : 0;

      return matchedTerms * 3 + titleMatches * 2 + creatorMatches * 2 + exactTitle + exactCreator;
    };
    const relevanceDifference = relevance(b) - relevance(a);
    if (relevanceDifference !== 0) return relevanceDifference;

    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    const aViews = a.viewCount ?? 0;
    const bViews = b.viewCount ?? 0;

    if (bViews !== aViews) return bViews - aViews;
    return bDate - aDate;
  });
}

type SourceCursor = { page: number; pageToken?: string; limit?: number; exhausted?: boolean };
type CatalogCursor = Partial<Record<VideoSource, SourceCursor>>;

function decodeCursor(token?: string): CatalogCursor {
  if (!token) return {};
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as CatalogCursor;
  } catch {
    return {};
  }
}

function encodeCursor(cursor: CatalogCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export const searchVideoCatalogPage = cache(async (options: VideoCatalogQuery & { pageToken?: string } = {}): Promise<VideoSearchPage> => {
  const { q, channelId, source, category, limit = 24 } = options;
  const enabledSources = getEnabledVideoSources();
  const selectedSources = source && source !== "all" ? [source] : enabledSources;
  const cursor = decodeCursor(options.pageToken);
  const activeSources = selectedSources.filter((currentSource) => !cursor[currentSource]?.exhausted);
  if (!activeSources.length) return { videos: [], hasMore: false };

  const initialPerSourceLimit = Math.max(1, Math.ceil(limit / activeSources.length));
  const nextCursor: CatalogCursor = { ...cursor };
  const sourceResults = await Promise.all(activeSources.map(async (currentSource) => {
    const adapter = videoAdapters[currentSource];
    if (!adapter) {
      nextCursor[currentSource] = { page: 1, exhausted: true };
      return [] as NormalizedVideo[];
    }

    const previous = cursor[currentSource] ?? { page: 1 };
    try {
      const sourceLimit = previous.limit ?? initialPerSourceLimit;
      const searchOptions = {
        q,
        channelId,
        source: currentSource,
        category,
        limit: sourceLimit,
        page: previous.page,
        pageToken: previous.pageToken,
      };
      let items: NormalizedVideo[];
      let hasMore: boolean;
      let pageToken: string | undefined;

      if (adapter.searchPage) {
        const result = await adapter.searchPage(searchOptions);
        items = result.videos;
        hasMore = result.hasMore;
        pageToken = result.nextPageToken;
      } else {
        items = await adapter.search(searchOptions);
        hasMore = items.length >= sourceLimit;
      }

      nextCursor[currentSource] = {
        page: previous.page + 1,
        pageToken,
        limit: sourceLimit,
        exhausted: !hasMore,
      };
      return items;
    } catch (error) {
      console.error(`Video source failed: ${currentSource}`, error);
      nextCursor[currentSource] = { ...previous, exhausted: true };
      return [] as NormalizedVideo[];
    }
  }));

  const videos = dedupeVideos(sortVideoSearchResults(sourceResults.flat(), q));
  const hasMore = selectedSources.some((currentSource) => !nextCursor[currentSource]?.exhausted);
  return {
    videos,
    hasMore,
    nextPageToken: hasMore ? encodeCursor(nextCursor) : undefined,
  };
});

export const searchVideoCatalog = cache(async (options: VideoCatalogQuery = {}): Promise<NormalizedVideo[]> => {
  return (await searchVideoCatalogPage(options)).videos;
});

export const getVideoCatalogItem = cache(async (id: string, source?: VideoSource): Promise<NormalizedVideo | null> => {
  const selectedSources = source ? [source] : getEnabledVideoSources();

  for (const currentSource of selectedSources) {
    try {
      const adapter = videoAdapters[currentSource];
      if (!adapter) continue;
      const video = await adapter.getVideo(id);
      if (video) return video;
    } catch (error) {
      console.error(`Video lookup failed: ${currentSource}`, error);
    }
  }

  return null;
});
