import assert from "node:assert/strict";
import test from "node:test";

import { getYouTubeEmbedUrl, normalizeYouTubeVideoId } from "@/lib/youtube";

test("YouTube feed IDs normalize their source prefix for player embeds", () => {
  const videoId = "hqVp4YMhTB4";

  assert.equal(normalizeYouTubeVideoId(`youtube:${videoId}`), videoId);
  assert.equal(
    getYouTubeEmbedUrl(`youtube:${videoId}`, "http://192.168.1.15:3001"),
    `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&playsinline=1&rel=0&origin=http%3A%2F%2F192.168.1.15%3A3001`,
  );
});
