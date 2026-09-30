import type { FeedVideo } from "@/lib/feed-videos";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "how",
  "in",
  "of",
  "the",
  "to",
  "vs",
  "with",
]);

function words(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.has(word))
  );
}

function category(video: FeedVideo) {
  const text = `${video.title} ${video.channelTitle}`.toLowerCase();

  if (/music|song|audio|cover|lisa|gato|d icen|le dicen/.test(text)) return "music";
  if (/game|gaming|minecraft|honkai|tournament|scary|island/.test(text)) return "gaming";
  if (/trailer|movie|film|series|harry potter|silo/.test(text)) return "entertainment";
  return "other";
}

function similarity(left: Set<string>, right: Set<string>) {
  let shared = 0;
  left.forEach((word) => {
    if (right.has(word)) shared += 1;
  });

  return shared / Math.max(left.size, right.size, 1);
}

function freshness(video: FeedVideo) {
  const ageInDays = Math.max(0, (Date.now() - new Date(video.publishedAt).getTime()) / 86_400_000);
  return Math.exp(-ageInDays / 14);
}

function popularity(video: FeedVideo) {
  return Math.min(1, Math.log10(Math.max(Number(video.viewCount), 1)) / 9);
}

export function recommendVideos(videos: FeedVideo[], currentVideoId?: string, limit = 6) {
  const current = videos.find((video) => video.id === currentVideoId);
  const currentWords = current ? words(`${current.title} ${current.channelTitle}`) : new Set<string>();
  const currentCategory = current ? category(current) : null;

  return videos
    .filter((video) => video.id !== currentVideoId)
    .map((video) => {
      const sameChannel = current && video.channelTitle === current.channelTitle ? 1 : 0;
      const sameCategory = currentCategory && category(video) === currentCategory ? 1 : 0;
      const contentSimilarity = current ? similarity(currentWords, words(`${video.title} ${video.channelTitle}`)) : 0;
      const score =
        contentSimilarity * 0.45 +
        sameCategory * 0.2 +
        sameChannel * 0.15 +
        freshness(video) * 0.1 +
        popularity(video) * 0.1;

      return { video, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ video }) => video);
}