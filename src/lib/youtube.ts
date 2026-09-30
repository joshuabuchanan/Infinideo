const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function normalizeYouTubeVideoId(value: string): string | null {
  const trimmedValue = value.trim();
  const sourcePrefixedId = trimmedValue.match(/^youtube:([A-Za-z0-9_-]{11})$/i)?.[1];
  if (sourcePrefixedId) return sourcePrefixedId;
  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmedValue)) return trimmedValue;

  try {
    const url = new URL(trimmedValue);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) {
      const embedMatch = url.pathname.match(/^\/embed\/([^/]+)$/);
      const id = embedMatch?.[1] ?? url.searchParams.get("v");
      return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string, origin?: string): string | null {
  const normalizedVideoId = normalizeYouTubeVideoId(videoId);
  if (!normalizedVideoId) return null;

  const params = new URLSearchParams({
    autoplay: "0",
    controls: "1",
    playsinline: "1",
    rel: "0",
  });
  const currentOrigin = origin ?? (typeof window === "undefined" ? "" : window.location.origin);
  if (!currentOrigin) return null;
  params.set("origin", currentOrigin);

  return `https://www.youtube.com/embed/${normalizedVideoId}?${params.toString()}`;
}