import assert from "node:assert/strict";
import test from "node:test";

import { getFreeVideoPool, paginateFreeVideos } from "./free-video-feed";

test("free video pool produces a deep enough feed for infinite scroll", () => {
  const pool = getFreeVideoPool();

  assert.ok(pool.length >= 24, `expected at least 24 free videos, got ${pool.length}`);
  assert.ok(pool.every((video) => Boolean(video.videoUrl && video.thumbnail)));

  const firstPage = paginateFreeVideos({ page: 1, limit: 10 });
  assert.equal(firstPage.videos.length, 10);
  assert.ok(firstPage.hasMore);

  const pageTwo = paginateFreeVideos({ page: 2, limit: 10 });
  assert.equal(pageTwo.videos.length, 10);
  assert.ok(pageTwo.videos.some((video) => video.id !== firstPage.videos[0]?.id));
});
