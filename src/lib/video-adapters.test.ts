import assert from "node:assert/strict";
import test from "node:test";

import { DailymotionAdapter, PexelsAdapter, PixabayAdapter, PeerTubeAdapter, YouTubeAdapter, WikimediaAdapter } from "@/lib/video-adapters";

test("YouTube popular videos use the videos.list chart endpoint", async () => {
  const previousApiKey = process.env.YOUTUBE_API_KEY;
  const previousFetch = globalThis.fetch;
  let requestUrl: URL | undefined;
  process.env.YOUTUBE_API_KEY = "test-api-key";
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    requestUrl = new URL(url);
    return new Response(JSON.stringify({
      items: [{
        id: "popularVideo01",
        snippet: {
          title: "Popular video",
          channelTitle: "A channel",
          thumbnails: { high: { url: "https://example.com/thumbnail.jpg" } },
        },
        statistics: { viewCount: "1234" },
        contentDetails: { duration: "PT2M5S" },
      }],
    }), { headers: { "content-type": "application/json" } });
  };

  try {
    const videos = await new YouTubeAdapter().search({});

    assert.equal(requestUrl?.pathname, "/youtube/v3/videos");
    assert.equal(requestUrl?.searchParams.get("chart"), "mostPopular");
    assert.equal(requestUrl?.searchParams.has("type"), false);
    assert.equal(videos[0]?.id, "youtube:popularVideo01");
    assert.equal(videos[0]?.viewCount, 1234);
    assert.equal(videos[0]?.duration, 125);
    assert.equal(videos[0]?.videoUrl, undefined);
    assert.match(videos[0]?.embedUrl ?? "", /youtube\.com\/embed\/popularVideo01/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = previousApiKey;
  }
});

test("YouTube search omits videos that cannot be embedded", async () => {
  const previousApiKey = process.env.YOUTUBE_API_KEY;
  const previousFetch = globalThis.fetch;
  const requestUrls: URL[] = [];
  process.env.YOUTUBE_API_KEY = "test-api-key";
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    requestUrls.push(url);

    if (url.pathname.endsWith("/search")) {
      return new Response(JSON.stringify({
        items: [
          { id: { videoId: "embeddable01" } },
          { id: { videoId: "blockedVideo1" } },
        ],
      }), { headers: { "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({
      items: [
        {
          id: "embeddable01",
          snippet: { title: "Can be embedded" },
          status: { embeddable: true },
        },
        {
          id: "blockedVideo1",
          snippet: { title: "Embedding disabled" },
          status: { embeddable: false },
        },
      ],
    }), { headers: { "content-type": "application/json" } });
  };

  try {
    const videos = await new YouTubeAdapter().search({ q: "video", limit: 2 });

    assert.match(requestUrls[1]?.searchParams.get("part") ?? "", /status/);
    assert.deepEqual(videos.map((video) => video.sourceVideoId), ["embeddable01"]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = previousApiKey;
  }
});

test("Pexels search maps a typed query to playable attributed video results", async () => {
  const previousApiKey = process.env.PEXELS_API_KEY;
  const previousFetch = globalThis.fetch;
  let requestUrl: URL | undefined;
  process.env.PEXELS_API_KEY = "test-pexels-key";
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    requestUrl = new URL(url);
    assert.equal(new Headers(init?.headers).get("Authorization"), "test-pexels-key");
    return new Response(JSON.stringify({
      videos: [{
        id: 81001,
        url: "https://www.pexels.com/video/81001/",
        image: "https://images.pexels.com/thumbnail.jpg",
        duration: 8,
        user: { name: "Phone Creator", url: "https://www.pexels.com/@phonecreator" },
        video_files: [
          { link: "https://videos.pexels.com/phone.mp4", file_type: "video/mp4", width: 1080, height: 1920 },
        ],
      }],
    }), { headers: { "content-type": "application/json" } });
  };

  try {
    const videos = await new PexelsAdapter().search({ q: "phones", limit: 20 });

    assert.equal(requestUrl?.pathname, "/videos/search");
    assert.equal(requestUrl?.searchParams.get("query"), "phones");
    assert.equal(videos[0]?.sourceVideoId, "81001");
    assert.equal(videos[0]?.videoUrl, "https://videos.pexels.com/phone.mp4");
    assert.equal(videos[0]?.creator, "Phone Creator");
    assert.equal(videos[0]?.licenseUrl, "https://www.pexels.com/license/");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.PEXELS_API_KEY;
    else process.env.PEXELS_API_KEY = previousApiKey;
  }
});

test("Dailymotion search advances to the requested provider page", async () => {
  const previousFetch = globalThis.fetch;
  let requestUrl: URL | undefined;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    requestUrl = new URL(url);
    return new Response(JSON.stringify({
      list: [{
        id: `clip-page-${requestUrl.searchParams.get("page")}`,
        title: "A page-specific clip",
        description: "Pagination test video",
        duration: 42,
        thumbnail_360_url: "https://example.com/clip.jpg",
        url: `https://www.dailymotion.com/video/clip-page-${requestUrl.searchParams.get("page")}`,
      }],
    }), { headers: { "content-type": "application/json" } });
  };

  try {
    const videos = await new DailymotionAdapter().search({ q: "test", page: 2, limit: 5 });

    assert.equal(requestUrl?.searchParams.get("page"), "2");
    assert.equal(requestUrl?.searchParams.get("limit"), "5");
    assert.equal(videos[0]?.id, "dailymotion:clip-page-2");
    assert.equal(videos[0]?.videoUrl, undefined);
    assert.equal(videos[0]?.embedUrl, "https://geo.dailymotion.com/player.html?video=clip-page-2");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Dailymotion search filters videos that disallow embedding", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    list: [
      { id: "embeddable01", title: "Playable", allow_embed: true },
      { id: "blocked001", title: "Blocked", allow_embed: false },
    ],
  }), { headers: { "content-type": "application/json" } });

  try {
    const videos = await new DailymotionAdapter().search({ q: "video", limit: 2 });
    assert.deepEqual(videos.map((video) => video.sourceVideoId), ["embeddable01"]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Pixabay video search advances pages and maps playable thumbnail variants", async () => {
  const previousApiKey = process.env.PIXABAY_API_KEY;
  const previousFetch = globalThis.fetch;
  let requestUrl: URL | undefined;
  process.env.PIXABAY_API_KEY = "test-pixabay-key";
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    requestUrl = new URL(url);
    return new Response(JSON.stringify({
      hits: [{
        id: 876,
        pageURL: "https://pixabay.com/videos/id-876/",
        tags: "phone, technology",
        duration: 12,
        user: "Creator",
        views: 45,
        videos: {
          medium: {
            url: "https://cdn.pixabay.com/video/876_medium.mp4",
            thumbnail: "https://cdn.pixabay.com/video/876_medium.jpg",
            width: 1280,
            height: 720,
          },
        },
      }],
    }), { headers: { "content-type": "application/json" } });
  };

  try {
    const videos = await new PixabayAdapter().search({ q: "phone", page: 3, limit: 8 });

    assert.equal(requestUrl?.searchParams.get("page"), "3");
    assert.equal(requestUrl?.searchParams.get("per_page"), "8");
    assert.equal(videos[0]?.id, "pixabay:876");
    assert.equal(videos[0]?.videoUrl, "https://cdn.pixabay.com/video/876_medium.mp4");
    assert.equal(videos[0]?.thumbnailUrl, "https://cdn.pixabay.com/video/876_medium.jpg");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.PIXABAY_API_KEY;
    else process.env.PIXABAY_API_KEY = previousApiKey;
  }
});

test("PeerTube search returns its embed URL instead of the watch page as a media file", async () => {
  const previousInstance = process.env.PEERTUBE_INSTANCE_URL;
  const previousFetch = globalThis.fetch;
  process.env.PEERTUBE_INSTANCE_URL = "https://peertube.example";
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: [{
      uuid: "clip-123",
      name: "PeerTube sample",
      url: "https://peertube.example/w/clip-123",
      thumbnailPath: "/lazy-static/thumbnails/clip.jpg",
      channel: { displayName: "PeerTube creator" },
    }],
  }), { headers: { "content-type": "application/json" } });

  try {
    const videos = await new PeerTubeAdapter().search({ q: "sample", limit: 1 });

    assert.equal(videos[0]?.videoUrl, undefined);
    assert.equal(videos[0]?.embedUrl, "https://peertube.example/videos/embed/clip-123");
    assert.equal(videos[0]?.sourceUrl, "https://peertube.example/w/clip-123");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousInstance === undefined) delete process.env.PEERTUBE_INSTANCE_URL;
    else process.env.PEERTUBE_INSTANCE_URL = previousInstance;
  }
});

test("Wikimedia search filters image files out of video results", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    query: {
      pages: {
        "1": {
          title: "File:space-shuttle.jpg",
          fullurl: "https://commons.wikimedia.org/wiki/File:space-shuttle.jpg",
          imageinfo: [{ url: "https://upload.wikimedia.org/space-shuttle.jpg", thumburl: "https://upload.wikimedia.org/space-shuttle-thumb.jpg" }],
        },
        "2": {
          title: 'File:<a rel="nofollow" href="https://example.com">Space launch.webm</a>',
          fullurl: "https://commons.wikimedia.org/wiki/File:space-launch.webm",
          imageinfo: [{ url: "https://upload.wikimedia.org/space-launch.webm", thumburl: "https://upload.wikimedia.org/space-launch-thumb.jpg" }],
        },
      },
    },
  }), { headers: { "content-type": "application/json" } });

  try {
    const videos = await new WikimediaAdapter().search({ q: "space launch", limit: 2 });

    assert.equal(videos.length, 1);
    assert.equal(videos[0]?.sourceVideoId, 'File:<a rel="nofollow" href="https://example.com">Space launch.webm</a>');
    assert.equal(videos[0]?.title, "Space launch.webm");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("YouTube channel catalog requests are scoped to the selected channel", async () => {
  const previousApiKey = process.env.YOUTUBE_API_KEY;
  const previousFetch = globalThis.fetch;
  const requestUrls: URL[] = [];
  process.env.YOUTUBE_API_KEY = "test-api-key";
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    requestUrls.push(url);
    const payload = url.pathname.endsWith("/search")
      ? { items: [{ id: { videoId: "channelVid001" } }], nextPageToken: "next-page" }
      : {
          items: [{
            id: "channelVid001",
            snippet: {
              title: "A channel tutorial",
              channelTitle: "Dorian Develops",
              channelId: "UC1234567890123456789012",
              thumbnails: { high: { url: "https://example.com/channel.jpg" } },
            },
            contentDetails: { duration: "PT8M" },
          }],
        };
    return new Response(JSON.stringify(payload), { headers: { "content-type": "application/json" } });
  };

  try {
    const result = await new YouTubeAdapter().searchPage({ channelId: "UC1234567890123456789012", limit: 5 });

    assert.equal(requestUrls[0]?.searchParams.get("channelId"), "UC1234567890123456789012");
    assert.equal(requestUrls[0]?.searchParams.get("type"), "video");
    assert.equal(result.videos[0]?.creator, "Dorian Develops");
    assert.equal(result.videos[0]?.channelId, "UC1234567890123456789012");
    assert.equal(result.videos[0]?.creatorUrl, "https://www.youtube.com/channel/UC1234567890123456789012");
    assert.equal(result.hasMore, true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = previousApiKey;
  }
});