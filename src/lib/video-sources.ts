export type VideoSourceId =
  | "internet-archive"
  | "wikimedia-commons"
  | "nasa"
  | "peertube"
  | "youtube"
  | "twitch"
  | "pexels"
  | "pixabay"
  | "dailymotion"
  | "blender"
  | "ihavenotv";

export type VideoSource =
  | "youtube"
  | "nasa"
  | "wikimedia"
  | "internet-archive"
  | "peertube"
  | "dailymotion"
  | "twitch"
  | "pexels"
  | "pixabay"
  | "blender"
  | "ihavenotv";

export type NormalizedVideo = {
  id: string;
  source: VideoSource;
  sourceVideoId: string;
  channelId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  sourceUrl: string;
  creator?: string;
  creatorUrl?: string;
  publishedAt?: string;
  duration?: number;
  category?: string;
  license?: string;
  licenseUrl?: string;
  thumbnailAttribution?: string;
  viewCount?: number;
};

export type VideoSearchOptions = {
  q?: string;
  channelId?: string;
  source?: VideoSource | "all";
  category?: string;
  limit?: number;
  page?: number;
  pageToken?: string;
};

export type VideoSearchPage = {
  videos: NormalizedVideo[];
  nextPageToken?: string;
  hasMore: boolean;
};

export interface VideoSourceAdapter {
  source: VideoSource;
  search(options: VideoSearchOptions): Promise<NormalizedVideo[]>;
  searchPage?(options: VideoSearchOptions): Promise<VideoSearchPage>;
  getVideo(id: string): Promise<NormalizedVideo | null>;
}

export type VideoSourceDefinition = {
  id: VideoSourceId;
  label: string;
  access: "public-api" | "oauth-or-api-key" | "instance-api";
  productionReady: boolean;
  attributionRequired: boolean;
  notes: string;
};

export const videoSources: VideoSourceDefinition[] = [
  {
    id: "internet-archive",
    label: "Internet Archive",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Use item metadata and only files with a documented license.",
  },
  {
    id: "wikimedia-commons",
    label: "Wikimedia Commons",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Store the file page and the individual license with every result.",
  },
  {
    id: "nasa",
    label: "NASA",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Follow NASA media, logo, and third-party content guidelines.",
  },
  {
    id: "peertube",
    label: "PeerTube",
    access: "instance-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Use an instance's documented API and respect its federation rules.",
  },
  {
    id: "youtube",
    label: "YouTube",
    access: "oauth-or-api-key",
    productionReady: false,
    attributionRequired: true,
    notes: "Development-only until API terms, quotas, embeds, and privacy disclosures are configured.",
  },
  {
    id: "twitch",
    label: "Twitch Clips",
    access: "oauth-or-api-key",
    productionReady: true,
    attributionRequired: true,
    notes: "Use the official clips API and Twitch's embedded player with the current parent domain.",
  },
  {
    id: "pexels",
    label: "Pexels Videos",
    access: "oauth-or-api-key",
    productionReady: true,
    attributionRequired: true,
    notes: "Search stock video metadata with the server-side API key and link each result back to Pexels.",
  },
  {
    id: "pixabay",
    label: "Pixabay Videos",
    access: "oauth-or-api-key",
    productionReady: true,
    attributionRequired: true,
    notes: "Use the official video search API with a server-side key and follow Pixabay's API and content license terms.",
  },
  {
    id: "dailymotion",
    label: "Dailymotion",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Use the public video metadata API and keep source attribution on each result.",
  },
  {
    id: "ihavenotv",
    label: "I Have Not TV",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Scrape the documentary index and detail pages while preserving attribution to the original site.",
  },
  {
    id: "blender",
    label: "Blender",
    access: "public-api",
    productionReady: true,
    attributionRequired: true,
    notes: "Use official blender and archive metadata with documented Creative Commons licensing.",
  },
];
