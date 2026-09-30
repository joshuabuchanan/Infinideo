import assert from "node:assert/strict";
import test from "node:test";

import { sortVideoSearchResults } from "@/lib/video-catalog";
import type { NormalizedVideo } from "@/lib/video-sources";

const videos: NormalizedVideo[] = [
  {
    id: "youtube:popular",
    source: "youtube",
    sourceVideoId: "popular",
    title: "Brent reacts to a viral clip",
    creator: "Trending Creator",
    sourceUrl: "https://example.com/popular",
    viewCount: 900_000,
  },
  {
    id: "youtube:brent-rivera",
    source: "youtube",
    sourceVideoId: "brent-rivera",
    title: "Brent Rivera's latest video",
    creator: "Brent Rivera",
    sourceUrl: "https://example.com/brent-rivera",
    viewCount: 12_000,
  },
];

test("video search ranks title and creator keyword matches above popularity", () => {
  const results = sortVideoSearchResults(videos, "Brent Rivera");

  assert.deepEqual(results.map((video) => video.id), [
    "youtube:brent-rivera",
    "youtube:popular",
  ]);
});
