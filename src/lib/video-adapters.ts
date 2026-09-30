import type {
  NormalizedVideo,
  VideoSearchOptions,
  VideoSource,
  VideoSourceAdapter,
  VideoSearchPage,
} from "@/lib/video-sources";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

function normalizeLabel(value?: unknown) {
  if (typeof value !== "string") return undefined;
  return stripHtml(value) || undefined;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function stripHtml(value?: string) {
  return decodeHtmlEntities(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDirectVideoUrl(value?: string) {
  if (!value) return false;
  try {
    return /\.(?:webm|ogv|ogg|mp4|m4v|mov|avi|mpeg|mpg)$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

function parseYouTubeDuration(value?: string): number | undefined {
  if (!value) return undefined;

  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

type YouTubeVideoItem = {
  id?: string;
  snippet?: {
    categoryId?: string;
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    description?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean };
};

function isYouTubeEmbeddable(item: YouTubeVideoItem) {
  return item.status?.embeddable !== false;
}

const youtubeCategoryNames: Record<string, string> = {
  "1": "Film and animation",
  "2": "Cars and vehicles",
  "10": "Music",
  "15": "Pets and animals",
  "17": "Sports",
  "19": "Travel and events",
  "20": "Gaming",
  "22": "People and blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News and politics",
  "26": "How-to and style",
  "27": "Education",
  "28": "Science and technology",
};

function toYouTubeVideo(item: YouTubeVideoItem): NormalizedVideo | null {
  if (!item.id) return null;
  const snippet = item.snippet ?? {};
  const id = item.id;
  const sourceUrl = `https://www.youtube.com/watch?v=${id}`;

  return {
    id: `youtube:${id}`,
    source: "youtube",
    sourceVideoId: id,
    channelId: snippet.channelId,
    title: snippet.title ?? "Untitled video",
    description: snippet.description,
    thumbnailUrl:
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${id}?autoplay=0&controls=1&playsinline=1`,
    sourceUrl,
    creator: normalizeLabel(snippet.channelTitle) ?? "YouTube",
    creatorUrl: snippet.channelId ? `https://www.youtube.com/channel/${snippet.channelId}` : undefined,
    publishedAt: snippet.publishedAt,
    duration: parseYouTubeDuration(item.contentDetails?.duration),
    viewCount: Number(item.statistics?.viewCount ?? 0),
    category: snippet.categoryId ? youtubeCategoryNames[snippet.categoryId] : undefined,
  };
}

export class YouTubeAdapter implements VideoSourceAdapter {
  source: VideoSource = "youtube";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    return (await this.searchPage(options)).videos;
  }

  async searchPage(options: VideoSearchOptions): Promise<VideoSearchPage> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { videos: [], hasMore: false };

    const limit = Math.max(1, Math.min(options.limit ?? 20, 50));
    const query = options.q?.trim();
    if (!query && !options.channelId) {
      const popularParams = new URLSearchParams({
        part: "snippet,statistics,contentDetails,status",
        chart: "mostPopular",
        regionCode: "US",
        maxResults: String(limit),
        key: apiKey,
      });
      if (options.pageToken) popularParams.set("pageToken", options.pageToken);
      const popularResponse = await fetch(`${YOUTUBE_API_URL}/videos?${popularParams.toString()}`, { next: { revalidate: 300 } });
      if (!popularResponse.ok) return { videos: [], hasMore: false };
      const popularData = (await popularResponse.json()) as { items?: YouTubeVideoItem[]; nextPageToken?: string };
      return {
        videos: (popularData.items ?? [])
          .filter(isYouTubeEmbeddable)
          .map(toYouTubeVideo)
          .filter((video): video is NormalizedVideo => video !== null),
        nextPageToken: popularData.nextPageToken,
        hasMore: Boolean(popularData.nextPageToken),
      };
    }

    const params = new URLSearchParams({
      part: "snippet",
      maxResults: String(limit),
      type: "video",
      key: apiKey,
    });

    if (query) params.set("q", query);
    if (options.channelId) params.set("channelId", options.channelId);
    if (options.pageToken) params.set("pageToken", options.pageToken);

    const searchResponse = await fetch(`${YOUTUBE_API_URL}/search?${params.toString()}`, { next: { revalidate: 300 } });
    if (!searchResponse.ok) return { videos: [], hasMore: false };
    const searchData = (await searchResponse.json()) as {
      items?: Array<{ id?: { videoId?: string } }>;
      nextPageToken?: string;
    };

    const ids = (searchData.items ?? [])
      .map((item) => item.id?.videoId)
      .filter(Boolean) as string[];

    if (!ids.length) return { videos: [], hasMore: false };

    const detailsResponse = await fetch(`${YOUTUBE_API_URL}/videos?${new URLSearchParams({
      part: "snippet,statistics,contentDetails,status",
      id: ids.join(","),
      key: apiKey,
    }).toString()}`, { next: { revalidate: 300 } });

    if (!detailsResponse.ok) return { videos: [], hasMore: false };
    const detailsData = (await detailsResponse.json()) as { items?: YouTubeVideoItem[] };
    return {
      videos: (detailsData.items ?? [])
        .filter(isYouTubeEmbeddable)
        .map(toYouTubeVideo)
        .filter((video): video is NormalizedVideo => video !== null),
      nextPageToken: searchData.nextPageToken,
      hasMore: Boolean(searchData.nextPageToken),
    };
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;
    const normalized = id.replace(/^youtube:/, "");
    const response = await fetch(`${YOUTUBE_API_URL}/videos?${new URLSearchParams({
      part: "snippet,statistics,contentDetails,status",
      id: normalized,
      key: apiKey,
    }).toString()}`, { next: { revalidate: 300 } });

    if (!response.ok) return null;
    const data = (await response.json()) as { items?: YouTubeVideoItem[] };
    const video = data.items?.[0];
    return video && isYouTubeEmbeddable(video) ? toYouTubeVideo(video) : null;
  }
}

type TwitchGame = { id: string; name: string };
type TwitchClipData = {
  id: string;
  title: string;
  url: string;
  creator_name: string;
  game_id: string;
  created_at: string;
  duration: number;
  view_count: number;
  thumbnail_url: string;
};

let cachedTwitchToken: { value: string; expiresAt: number } | undefined;

async function getTwitchToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (cachedTwitchToken && cachedTwitchToken.expiresAt > Date.now() + 60_000) return cachedTwitchToken.value;

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  cachedTwitchToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

function toTwitchVideo(clip: TwitchClipData, gameName?: string): NormalizedVideo {
  return {
    id: `twitch:${clip.id}`,
    source: "twitch",
    sourceVideoId: clip.id,
    title: normalizeLabel(clip.title) ?? "Twitch clip",
    thumbnailUrl: clip.thumbnail_url,
    embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip.id)}`,
    sourceUrl: clip.url || `https://clips.twitch.tv/${clip.id}`,
    creator: normalizeLabel(clip.creator_name) ?? "Twitch creator",
    publishedAt: clip.created_at,
    duration: clip.duration,
    viewCount: clip.view_count,
    category: gameName ?? "Gaming",
    thumbnailAttribution: "Twitch",
  };
}

export class TwitchAdapter implements VideoSourceAdapter {
  source: VideoSource = "twitch";

  private async api<T>(path: string, token: string, clientId: string): Promise<T | null> {
    const response = await fetch(`https://api.twitch.tv/helix/${path}`, {
      headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });
    return response.ok ? (await response.json()) as T : null;
  }

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const token = await getTwitchToken();
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!token || !clientId) return [];

    const gamesData = await this.api<{ data?: TwitchGame[] }>("games/top?first=5", token, clientId);
    const games = gamesData?.data ?? [];
    const gameNames = new Map(games.map((game) => [game.id, game.name]));
    const clipGroups = await Promise.all(games.map((game) =>
      this.api<{ data?: TwitchClipData[] }>(`clips?game_id=${encodeURIComponent(game.id)}&first=100`, token, clientId),
    ));
    const query = options.q?.trim().toLowerCase();
    const limit = Math.max(1, options.limit ?? 20);
    const offset = (Math.max(1, options.page ?? 1) - 1) * limit;

    return clipGroups
      .flatMap((group) => group?.data ?? [])
      .filter((clip) => !query || `${clip.title} ${clip.creator_name} ${gameNames.get(clip.game_id) ?? ""}`.toLowerCase().includes(query))
      .slice(offset, offset + limit)
      .map((clip) => toTwitchVideo(clip, gameNames.get(clip.game_id)));
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const token = await getTwitchToken();
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!token || !clientId) return null;
    const clipId = id.replace(/^twitch:/, "");
    const data = await this.api<{ data?: TwitchClipData[] }>(`clips?id=${encodeURIComponent(clipId)}`, token, clientId);
    const clip = data?.data?.[0];
    return clip ? toTwitchVideo(clip) : null;
  }
}

type PexelsVideoFile = {
  link?: string;
  file_type?: string;
  width?: number;
  height?: number;
  quality?: string;
};

type PexelsVideo = {
  id: number;
  url: string;
  image: string;
  duration: number;
  user?: { name?: string; url?: string };
  video_files?: PexelsVideoFile[];
};

export class PexelsAdapter implements VideoSourceAdapter {
  source: VideoSource = "pexels";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return [];

    const query = options.q?.trim() || "popular videos";
    const perPage = Math.max(1, Math.min(options.limit ?? 20, 80));
    const url = new URL("https://api.pexels.com/videos/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(Math.max(1, options.page ?? 1)));

    const response = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];

    const data = (await response.json()) as { videos?: PexelsVideo[] };
    return (data.videos ?? []).flatMap((video) => {
      const files = (video.video_files ?? []).filter((file) =>
        file.file_type?.startsWith("video/") && file.link,
      );
      const file = files.sort((a, b) => {
        const aPixels = (a.width ?? 0) * (a.height ?? 0);
        const bPixels = (b.width ?? 0) * (b.height ?? 0);
        return bPixels - aPixels;
      })[0];
      if (!file?.link) return [];

      const creator = normalizeLabel(video.user?.name) ?? "Pexels creator";
      return [{
        id: `pexels:${video.id}`,
        source: "pexels" as const,
        sourceVideoId: String(video.id),
        title: `${query} video by ${creator}`,
        description: `Pexels stock video matching ${query}.`,
        thumbnailUrl: video.image,
        videoUrl: file.link,
        embedUrl: file.link,
        sourceUrl: video.url,
        creator,
        creatorUrl: video.user?.url,
        duration: video.duration,
        category: "Stock video",
        license: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        thumbnailAttribution: "Pexels",
      }];
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    const normalized = id.replace(/^pexels:/, "");
    const videoId = Number(normalized);
    if (!apiKey || !Number.isInteger(videoId) || videoId < 1) return null;

    const response = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 1800 },
    });
    if (!response.ok) return null;

    const video = (await response.json()) as PexelsVideo;
    const files = (video.video_files ?? []).filter((file) => file.file_type?.startsWith("video/") && file.link);
    const file = files.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))[0];
    if (!file?.link) return null;

    const creator = normalizeLabel(video.user?.name) ?? "Pexels creator";
    return {
      id: `pexels:${video.id}`,
      source: "pexels",
      sourceVideoId: String(video.id),
      title: `Pexels video by ${creator}`,
      thumbnailUrl: video.image,
      videoUrl: file.link,
      embedUrl: file.link,
      sourceUrl: video.url,
      creator,
      creatorUrl: video.user?.url,
      duration: video.duration,
      category: "Stock video",
      license: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
      thumbnailAttribution: "Pexels",
    };
  }
}

type PixabayVideoFile = { url?: string; width?: number; height?: number; size?: number; thumbnail?: string };
type PixabayVideo = {
  id: number;
  pageURL: string;
  tags: string;
  duration: number;
  user: string;
  views: number;
  videos?: { large?: PixabayVideoFile; medium?: PixabayVideoFile; small?: PixabayVideoFile; tiny?: PixabayVideoFile };
};

function toPixabayVideo(video: PixabayVideo): NormalizedVideo | null {
  const files = Object.values(video.videos ?? {}).filter((file) => file?.url);
  const file = files.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))[0];
  if (!file?.url) return null;

  return {
    id: `pixabay:${video.id}`,
    source: "pixabay",
    sourceVideoId: String(video.id),
    title: video.tags || `Pixabay video by ${video.user}`,
    description: video.tags,
    thumbnailUrl: file.thumbnail ?? video.videos?.medium?.thumbnail ?? video.videos?.small?.thumbnail,
    videoUrl: file.url,
    embedUrl: file.url,
    sourceUrl: video.pageURL,
    creator: normalizeLabel(video.user) ?? "Pixabay creator",
    duration: video.duration,
    viewCount: video.views,
    category: "Stock video",
    license: "Pixabay Content License",
    licenseUrl: "https://pixabay.com/service/license-summary/",
    thumbnailAttribution: "Pixabay",
  };
}

export class PixabayAdapter implements VideoSourceAdapter {
  source: VideoSource = "pixabay";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) return [];

    const query = options.q?.trim() || "popular videos";
    const url = new URL("https://pixabay.com/api/videos/");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("per_page", String(Math.max(3, Math.min(options.limit ?? 20, 200))));
    url.searchParams.set("page", String(Math.max(1, options.page ?? 1)));
    url.searchParams.set("safesearch", "true");

    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const data = (await response.json()) as { hits?: PixabayVideo[] };
    return (data.hits ?? []).flatMap((video) => {
      const normalized = toPixabayVideo(video);
      return normalized ? [normalized] : [];
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^pixabay:/, "");
    const videoId = Number(normalized);
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey || !Number.isInteger(videoId) || videoId < 1) return null;
    const url = new URL("https://pixabay.com/api/videos/");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("id", String(videoId));
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return null;
    const data = (await response.json()) as { hits?: PixabayVideo[] };
    const video = data.hits?.[0];
    return video ? toPixabayVideo(video) : null;
  }
}

export class NasaAdapter implements VideoSourceAdapter {
  source: VideoSource = "nasa";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q || "space").trim() || "space";
    const limit = Math.max(1, Math.min(options.limit ?? 6, 12));
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q", query);
    url.searchParams.set("media_type", "video");
    url.searchParams.set("page_size", String(limit));
    url.searchParams.set("page", String(Math.max(1, options.page ?? 1)));

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      collection?: {
        items?: Array<{
          href?: string;
          data?: Array<{
            title?: string;
            nasa_id?: string;
            description?: string;
            date_created?: string;
            photographer?: string;
            center?: string;
            keywords?: string[];
          }>;
          links?: Array<{ href?: string; rel?: string; render?: string }>;
        }>;
      };
    };

    const items = data.collection?.items ?? [];
    return items.map((item) => {
      const meta = item.data?.[0] ?? {};
      const links = item.links ?? [];
      const videoLink = links.find((link) => /\.(mp4|m4v|mov|webm)$/i.test(link.href ?? "")) ?? links[0];
      const thumbnailLink = links.find((link) => /\.(jpg|jpeg|png|webp)$/i.test(link.href ?? "")) ?? links[0];
      const nasaId = meta.nasa_id || item.href?.split("/").filter(Boolean).at(-1) || "nasa-video";
      const sourceUrl = `https://images.nasa.gov/details/${nasaId}`;

      return {
        id: `nasa:${nasaId}`,
        source: "nasa",
        sourceVideoId: nasaId,
        title: normalizeLabel(meta.title) ?? "NASA video",
        description: normalizeLabel(meta.description),
        thumbnailUrl: thumbnailLink?.href,
        videoUrl: videoLink?.href,
        embedUrl: videoLink?.href,
        sourceUrl,
        creator: normalizeLabel(meta.photographer || meta.center) ?? "NASA",
        publishedAt: meta.date_created,
        category: (meta.keywords ?? []).includes("space") ? "Space" : "Science",
        license: "Public domain / NASA media guidelines",
        licenseUrl: "https://www.nasa.gov/multimedia/guidelines/",
        thumbnailAttribution: "NASA",
      };
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^nasa:/, "");
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q", normalized);
    url.searchParams.set("media_type", "video");
    url.searchParams.set("page_size", "1");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      collection?: { items?: Array<{ href?: string; data?: Array<{ title?: string; nasa_id?: string; description?: string; date_created?: string; photographer?: string; center?: string; keywords?: string[] }>; links?: Array<{ href?: string }> }> };
    };
    const item = data.collection?.items?.[0];
    if (!item) return null;

    const meta = item.data?.[0] ?? {};
    const nasaId = meta.nasa_id || normalized;
    const links = item.links ?? [];
    const videoLink = links.find((link) => /\.(mp4|m4v|mov|webm)$/i.test(link.href ?? "")) ?? links[0];
    const thumbnailLink = links.find((link) => /\.(jpg|jpeg|png|webp)$/i.test(link.href ?? "")) ?? links[0];

    return {
      id: `nasa:${nasaId}`,
      source: "nasa",
      sourceVideoId: nasaId,
      title: normalizeLabel(meta.title) ?? "NASA video",
      description: normalizeLabel(meta.description),
      thumbnailUrl: thumbnailLink?.href,
      videoUrl: videoLink?.href,
      embedUrl: videoLink?.href,
      sourceUrl: `https://images.nasa.gov/details/${nasaId}`,
      creator: normalizeLabel(meta.photographer || meta.center) ?? "NASA",
      publishedAt: meta.date_created,
      category: (meta.keywords ?? []).includes("space") ? "Space" : "Science",
      license: "Public domain / NASA media guidelines",
      licenseUrl: "https://www.nasa.gov/multimedia/guidelines/",
      thumbnailAttribution: "NASA",
    };
  }
}

export class WikimediaAdapter implements VideoSourceAdapter {
  source: VideoSource = "wikimedia";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q || "space").trim() || "space";
    const limit = Math.max(1, Math.min(options.limit ?? 6, 12));
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${query} has:video`);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", String(limit));
    url.searchParams.set("gsroffset", String((Math.max(1, options.page ?? 1) - 1) * limit));
    url.searchParams.set("prop", "imageinfo|info");
    url.searchParams.set("iiurlwidth", "800");
    url.searchParams.set("iiprop", "url|extmetadata");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      query?: {
        pages?: Record<string, {
          title?: string;
          fullurl?: string;
          imageinfo?: Array<{
            descriptionurl?: string;
            url?: string;
            thumburl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }>;
      };
    };

    const pages = Object.values(data.query?.pages ?? {});
    return pages.flatMap((page) => {
      const info = page.imageinfo?.[0];
      if (!isDirectVideoUrl(info?.url)) return [];
      const title = page.title ?? "Wikimedia Commons video";
      const fileName = normalizeLabel(title.replace(/^File:/, "")) ?? "Wikimedia Commons video";
      const sourceUrl = page.fullurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`;
      const license = stripHtml(info?.extmetadata?.LicenseShortName?.value)
        || stripHtml(info?.extmetadata?.License?.value)
        || "License information unavailable";
      return [{
        id: `wikimedia:${title}`,
        source: "wikimedia",
        sourceVideoId: title,
        title: fileName,
        thumbnailUrl: info?.thumburl,
        videoUrl: info?.url,
        embedUrl: info?.url,
        sourceUrl,
        creator: stripHtml(info?.extmetadata?.Artist?.value) || "Wikimedia Commons",
        license,
        licenseUrl: info?.extmetadata?.LicenseUrl?.value || undefined,
        thumbnailAttribution: "Wikimedia Commons",
        category: "Education",
      }];
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^wikimedia:/, "");
    if (!normalized) return null;
    return (await this.search({ q: normalized, limit: 1 }))[0] ?? null;
  }
}

export class InternetArchiveAdapter implements VideoSourceAdapter {
  source: VideoSource = "internet-archive";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q || "mediatype:(movies)").trim() || "mediatype:(movies)";
    const limit = Math.max(1, Math.min(options.limit ?? 6, 12));
    const url = new URL("https://archive.org/advancedsearch.php");
    url.searchParams.set("q", query);
    url.searchParams.set("rows", String(limit));
    url.searchParams.set("start", String((Math.max(1, options.page ?? 1) - 1) * limit));
    url.searchParams.set("output", "json");
    url.searchParams.set("fl[]", "identifier,title,description,creator,date,licenseurl,mediatype,collection");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      response?: { docs?: Array<{ identifier?: string; title?: string; description?: string; creator?: string; date?: string; licenseurl?: string; mediatype?: string; collection?: string[] }> };
    };

    return (data.response?.docs ?? []).map((doc) => {
      const identifier = doc.identifier ?? "";
      const title = normalizeLabel(doc.title) ?? "Internet Archive video";
      const sourceUrl = identifier ? `https://archive.org/details/${identifier}` : "https://archive.org";
      const thumbnailUrl = identifier ? `https://archive.org/services/img/${identifier}` : undefined;
      const directVideoUrl = identifier ? `https://archive.org/download/${identifier}/${identifier}.mp4` : undefined;
      return {
        id: `internet-archive:${identifier}`,
        source: "internet-archive",
        sourceVideoId: identifier,
        title,
        description: normalizeLabel(doc.description),
        thumbnailUrl,
        videoUrl: directVideoUrl,
        embedUrl: directVideoUrl,
        sourceUrl,
        creator: normalizeLabel(doc.creator) ?? "Internet Archive",
        publishedAt: doc.date,
        category: Array.isArray(doc.collection) && doc.collection.length > 0 ? doc.collection[0] : "Documentary",
        license: doc.licenseurl ? "License details" : "License information unavailable",
        licenseUrl: doc.licenseurl,
        thumbnailAttribution: "Internet Archive",
      };
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^internet-archive:/, "");
    if (!normalized) return null;
    const response = await fetch(`https://archive.org/advancedsearch.php?q=identifier:${encodeURIComponent(normalized)}&rows=1&output=json`, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      response?: { docs?: Array<{ identifier?: string; title?: string; description?: string; creator?: string; date?: string; licenseurl?: string; collection?: string[] }> };
    };
    const doc = data.response?.docs?.[0];
    if (!doc) return null;
    const identifier = doc.identifier ?? normalized;
    return {
      id: `internet-archive:${identifier}`,
      source: "internet-archive",
      sourceVideoId: identifier,
      title: normalizeLabel(doc.title) ?? "Internet Archive video",
      description: normalizeLabel(doc.description),
      thumbnailUrl: `https://archive.org/services/img/${identifier}`,
      videoUrl: `https://archive.org/download/${identifier}/${identifier}.mp4`,
      embedUrl: `https://archive.org/download/${identifier}/${identifier}.mp4`,
      sourceUrl: `https://archive.org/details/${identifier}`,
      creator: normalizeLabel(doc.creator) ?? "Internet Archive",
      publishedAt: doc.date,
      category: Array.isArray(doc.collection) && doc.collection.length > 0 ? doc.collection[0] : "Documentary",
      license: doc.licenseurl ? "License details" : "License information unavailable",
      licenseUrl: doc.licenseurl,
      thumbnailAttribution: "Internet Archive",
    };
  }
}

export class PeerTubeAdapter implements VideoSourceAdapter {
  source: VideoSource = "peertube";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const instanceUrl = (process.env.PEERTUBE_INSTANCE_URL || "https://peertube.tv").replace(/\/$/, "");
    const query = (options.q || "open media").trim() || "open media";
    const limit = Math.max(1, Math.min(options.limit ?? 6, 12));

    const url = new URL(`${instanceUrl}/api/v1/search/videos`);
    url.searchParams.set("search", query);
    url.searchParams.set("count", String(limit));
    url.searchParams.set("start", String((Math.max(1, options.page ?? 1) - 1) * limit));

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      data?: Array<{
        uuid?: string;
        name?: string;
        description?: string;
        url?: string;
        createdAt?: string;
        thumbnailPath?: string;
        duration?: number;
        views?: number;
        channel?: { displayName?: string; name?: string };
      }>;
    };

    return (data.data ?? []).map((video) => {
      const uuid = video.uuid ?? "";
      const channelName = video.channel?.displayName || video.channel?.name || "PeerTube";
      const sourceUrl = video.url || `${instanceUrl}/w/${uuid}`;
      const thumbnailUrl = video.thumbnailPath ? `${instanceUrl}${video.thumbnailPath}` : undefined;
      return {
        id: `peertube:${uuid}`,
        source: "peertube",
        sourceVideoId: uuid,
        title: normalizeLabel(video.name) ?? "PeerTube video",
        description: normalizeLabel(video.description),
        thumbnailUrl,
        videoUrl: undefined,
        embedUrl: `${instanceUrl}/videos/embed/${uuid}`,
        sourceUrl,
        creator: channelName,
        publishedAt: video.createdAt,
        duration: video.duration,
        viewCount: video.views,
        category: "Documentary",
        license: "License varies by uploader",
        licenseUrl: undefined,
        thumbnailAttribution: "PeerTube",
      };
    });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^peertube:/, "");
    if (!normalized) return null;
    const instanceUrl = (process.env.PEERTUBE_INSTANCE_URL || "https://peertube.tv").replace(/\/$/, "");
    const response = await fetch(`${instanceUrl}/api/v1/videos/${normalized}`, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const video = (await response.json()) as {
      uuid?: string;
      name?: string;
      description?: string;
      url?: string;
      createdAt?: string;
      thumbnailPath?: string;
      duration?: number;
      views?: number;
      channel?: { displayName?: string; name?: string };
    };

    if (!video.uuid) return null;
    const channelName = video.channel?.displayName || video.channel?.name || "PeerTube";
    const sourceUrl = video.url || `${instanceUrl}/w/${video.uuid}`;
    return {
      id: `peertube:${video.uuid}`,
      source: "peertube",
      sourceVideoId: video.uuid,
      title: normalizeLabel(video.name) ?? "PeerTube video",
      description: normalizeLabel(video.description),
      thumbnailUrl: video.thumbnailPath ? `${instanceUrl}${video.thumbnailPath}` : undefined,
      videoUrl: undefined,
      embedUrl: `${instanceUrl}/videos/embed/${video.uuid}`,
      sourceUrl,
      creator: channelName,
      publishedAt: video.createdAt,
      duration: video.duration,
      viewCount: video.views,
      category: "Documentary",
      license: "License varies by uploader",
      thumbnailAttribution: "PeerTube",
    };
  }
}

export class DailymotionAdapter implements VideoSourceAdapter {
  source: VideoSource = "dailymotion";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q || "science documentary").trim() || "science documentary";
    const limit = Math.max(1, Math.min(options.limit ?? 12, 20));
    const url = new URL("https://api.dailymotion.com/videos");
    url.searchParams.set("fields", "id,title,description,owner.username,created_time,duration,views_total,thumbnail_360_url,channel,url,allow_embed");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(Math.max(1, options.page ?? 1)));
    url.searchParams.set("sort", "recent");
    if (query && query !== "all") {
      url.searchParams.set("search", query);
    }

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      list?: Array<{
        id?: string;
        title?: string;
        description?: string;
        owner?: { username?: string };
        created_time?: number;
        duration?: number;
        views_total?: number;
        thumbnail_360_url?: string;
        channel?: string;
        url?: string;
        allow_embed?: boolean;
      }>;
    };

    return (data.list ?? [])
      .filter((video) => video.allow_embed !== false)
      .map((video) => {
      const id = video.id ?? "";
      const creator = normalizeLabel(video.owner?.username) ?? normalizeLabel(video.channel) ?? "Dailymotion";
      const sourceUrl = video.url || `https://www.dailymotion.com/video/${id}`;
      return {
        id: `dailymotion:${id}`,
        source: "dailymotion",
        sourceVideoId: id,
        title: normalizeLabel(video.title) ?? "Dailymotion video",
        description: normalizeLabel(video.description),
        thumbnailUrl: video.thumbnail_360_url,
        videoUrl: undefined,
        embedUrl: `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(id)}`,
        sourceUrl,
        creator,
        publishedAt: video.created_time ? new Date(video.created_time * 1000).toISOString() : undefined,
        duration: video.duration,
        viewCount: video.views_total,
        category: "Documentary",
        license: "License varies by uploader",
        thumbnailAttribution: "Dailymotion",
      };
      });
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^dailymotion:/, "");
    if (!normalized) return null;
    const url = new URL("https://api.dailymotion.com/video/" + normalized);
    url.searchParams.set("fields", "id,title,description,owner.username,created_time,duration,views_total,thumbnail_360_url,channel,url,allow_embed");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const video = (await response.json()) as {
      id?: string;
      title?: string;
      description?: string;
      owner?: { username?: string };
      created_time?: number;
      duration?: number;
      views_total?: number;
      thumbnail_360_url?: string;
      channel?: string;
      url?: string;
      allow_embed?: boolean;
    };
    if (!video.id || video.allow_embed === false) return null;

    const creator = normalizeLabel(video.owner?.username) ?? normalizeLabel(video.channel) ?? "Dailymotion";
    const sourceUrl = video.url || `https://www.dailymotion.com/video/${video.id}`;
    return {
      id: `dailymotion:${video.id}`,
      source: "dailymotion",
      sourceVideoId: video.id,
      title: normalizeLabel(video.title) ?? "Dailymotion video",
      description: normalizeLabel(video.description),
      thumbnailUrl: video.thumbnail_360_url,
      videoUrl: undefined,
      embedUrl: `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(video.id)}`,
      sourceUrl,
      creator,
      publishedAt: video.created_time ? new Date(video.created_time * 1000).toISOString() : undefined,
      duration: video.duration,
      viewCount: video.views_total,
      category: "Documentary",
      license: "License varies by uploader",
      thumbnailAttribution: "Dailymotion",
    };
  }
}

export class BlenderAdapter implements VideoSourceAdapter {
  source: VideoSource = "blender";

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q || "collection:(blender) OR collection:(blenderopenmovie)").trim() || "collection:(blender) OR collection:(blenderopenmovie)";
    const limit = Math.max(1, Math.min(options.limit ?? 6, 12));
    const archive = new InternetArchiveAdapter();
    const videos = await archive.search({ ...options, q: query, limit });
    return videos.map((video) => ({
      ...video,
      source: "blender",
      id: `blender:${video.sourceVideoId}`,
      sourceVideoId: video.sourceVideoId,
      category: "Animation",
      license: video.license || "CC BY 3.0",
      licenseUrl: video.licenseUrl || "https://creativecommons.org/licenses/by/3.0/",
    }));
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^blender:/, "");
    const archive = new InternetArchiveAdapter();
    const video = await archive.getVideo(`internet-archive:${normalized}`);
    if (!video) return null;
    return {
      ...video,
      source: "blender",
      id: `blender:${normalized}`,
      sourceVideoId: normalized,
      category: "Animation",
      license: video.license || "CC BY 3.0",
      licenseUrl: video.licenseUrl || "https://creativecommons.org/licenses/by/3.0/",
    };
  }
}

export class IHaveNotTVAdapter implements VideoSourceAdapter {
  source: VideoSource = "ihavenotv";

  private async getVideoBySlug(slug: string): Promise<NormalizedVideo | null> {
    const normalizedSlug = slug.replace(/^\/+|\/$/g, "").trim();
    if (!normalizedSlug) return null;

    const sourceUrl = `https://ihavenotv.com/${normalizedSlug}`;
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const html = await response.text();
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      ?? html.match(/<h1[^>]*>\s*<strong>\s*([^<]+)\s*<\/strong>/i)
      ?? html.match(/<title>([^<]+)<\/title>/i);

    const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
      ?? html.match(/<div\s+class="videoDetails"[\s\S]*?<p>([\s\S]*?)<\/p>/i);

    const thumbnailMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      ?? html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i);

    const categoryMatch = html.match(/Category:\s*<a[^>]*>\s*<strong>\s*([^<]+)\s*<\/strong>/i)
      ?? html.match(/<a\s+href="\/category\/[^\"]+"[^>]*>\s*<strong>\s*([^<]+)\s*<\/strong>/i);

    const durationMatch = html.match(/<meta\s+property="video:duration"\s+content="(\d+)"/i);
    const embedMatch = html.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
    const title = stripHtml(titleMatch?.[1]) || `I Have Not TV document: ${normalizedSlug}`;

    return {
      id: `ihavenotv:${normalizedSlug}`,
      source: "ihavenotv",
      sourceVideoId: normalizedSlug,
      title,
      description: stripHtml(descriptionMatch?.[1]),
      thumbnailUrl: thumbnailMatch?.[1] ?? `https://ihavenotv.com/img/${normalizedSlug}.jpg`,
      videoUrl: undefined,
      embedUrl: embedMatch?.[1],
      sourceUrl,
      creator: "I Have Not TV",
      publishedAt: html.match(/<small>\s*&bull;\s*(\d{4})\s*<\/small>/i)?.[1]
        ? new Date(`${html.match(/<small>\s*&bull;\s*(\d{4})\s*<\/small>/i)?.[1]}-01-01T00:00:00Z`).toISOString()
        : undefined,
      duration: durationMatch ? Number(durationMatch[1]) : undefined,
      category: stripHtml(categoryMatch?.[1]) || "Documentary",
      thumbnailAttribution: "I Have Not TV",
      viewCount: 0,
    };
  }

  async search(options: VideoSearchOptions): Promise<NormalizedVideo[]> {
    const query = (options.q ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(options.limit ?? 12, 20));
    const offset = (Math.max(1, options.page ?? 1) - 1) * limit;

    const response = await fetch("https://ihavenotv.com/listofalldocumentaries", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const html = await response.text();
    const matches = Array.from(html.matchAll(/<li>\s*<a\s+href\s*=\s*["']\/([^"']+)["'][^>]*>(.*?)<\/a>/gi));
    const seen = new Set<string>();
    const items: NormalizedVideo[] = [];

    let matchingSlugCount = 0;
    for (const match of matches) {
      const slug = match[1]?.replace(/^\/+|\/$/g, "").trim();
      const title = stripHtml(match[2]);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      if (query && !`${slug} ${title}`.toLowerCase().includes(query)) continue;
      if (matchingSlugCount < offset) {
        matchingSlugCount += 1;
        continue;
      }
      matchingSlugCount += 1;

      const detail = await this.getVideoBySlug(slug);
      if (detail) {
        items.push(detail);
      }

      if (items.length >= limit) break;
    }

    return items;
  }

  async getVideo(id: string): Promise<NormalizedVideo | null> {
    const normalized = id.replace(/^ihavenotv:/, "").replace(/^\/+|\/$/g, "");
    if (!normalized) return null;
    return this.getVideoBySlug(normalized);
  }
}

export const videoAdapters: Record<VideoSource, VideoSourceAdapter> = {
  youtube: new YouTubeAdapter(),
  twitch: new TwitchAdapter(),
  pexels: new PexelsAdapter(),
  pixabay: new PixabayAdapter(),
  nasa: new NasaAdapter(),
  wikimedia: new WikimediaAdapter(),
  "internet-archive": new InternetArchiveAdapter(),
  peertube: new PeerTubeAdapter(),
  dailymotion: new DailymotionAdapter(),
  blender: new BlenderAdapter(),
  ihavenotv: new IHaveNotTVAdapter(),
};
