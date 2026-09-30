"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Camera, Eye, ExternalLink, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

import type { FeedVideo } from "@/lib/feed-videos";
import type { VideoSource } from "@/lib/video-sources";
import { copyTextToClipboard } from "@/lib/copy-text-to-clipboard";
import { trpc } from "@/trpc/client";
import ClipCamera from "./ClipCamera";
import "./Feed.css";

function formatViews(viewCount: string) {
  const amount = Number(viewCount || "0");

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  }

  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }

  return amount.toString();
}

function formatRelativeDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Date unknown";

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function formatDuration(value: string) {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return "0:00";
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function shareClip(video: FeedVideo) {
  const clipUrl = `${window.location.origin}/feed/${video.id.replace(":", "/")}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: video.title, url: clipUrl });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  try {
    await copyTextToClipboard(clipUrl);
    toast.success("Clip link copied");
  } catch {
    toast.error("Could not share this clip");
  }
}

const clipLikesStorageKey = "infinideo:liked-clips";
const clipLikesChangedEvent = "infinideo-clip-likes-changed";

function subscribeToClipLikes(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(clipLikesChangedEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(clipLikesChangedEvent, onChange);
  };
}

function getClipLikesSnapshot() {
  try {
    return window.localStorage.getItem(clipLikesStorageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseClipLikes(value: string) {
  try {
    const storedIds: unknown = JSON.parse(value);
    return new Set(Array.isArray(storedIds) ? storedIds.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

interface FeedProps {
  search?: string;
  category?: string;
  source?: VideoSource;
  channelId?: string;
  clips?: boolean;
}

const Feed = ({ search, category, source, channelId, clips = false }: FeedProps) => {
  const { isLoaded, isSignedIn } = useAuth();
  const utils = trpc.useUtils();
  const recordedClipIdsRef = useRef(new Set<string>());
  const recordFeedWatch = trpc.feedVideoHistory.record.useMutation({
    onSuccess: () => {
      void utils.feedVideoHistory.getMany.invalidate();
    },
  });
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasLoadMoreError, setHasLoadMoreError] = useState(false);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [areClipDetailsVisible, setAreClipDetailsVisible] = useState(true);
  const [isClipCameraOpen, setIsClipCameraOpen] = useState(false);
  const likedClipIdsSnapshot = useSyncExternalStore(
    subscribeToClipLikes,
    getClipLikesSnapshot,
    () => "[]",
  );
  const likedClipIds = parseClipLikes(likedClipIdsSnapshot);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const clipsScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const seenVideoIdsRef = useRef(new Set<string>());
  const nextPageTokenRef = useRef<string | undefined>(undefined);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const requestIdRef = useRef(0);
  const seedVideoId = "qciHPEHxUAo";

  const toggleClipLike = (videoId: string) => {
    const next = new Set(likedClipIds);
    if (next.has(videoId)) next.delete(videoId);
    else next.add(videoId);
    try {
      localStorage.setItem(clipLikesStorageKey, JSON.stringify([...next]));
      window.dispatchEvent(new Event(clipLikesChangedEvent));
    } catch {}
  };

  const recordClipWatch = useCallback((video: FeedVideo) => {
    if (!isLoaded || !isSignedIn || recordedClipIdsRef.current.has(video.id)) return;
    recordedClipIdsRef.current.add(video.id);
    recordFeedWatch.mutate({
      sourceId: video.sourceId ?? "internet-archive",
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt,
      viewCount: video.viewCount,
      duration: video.duration,
      sourceUrl: video.sourceUrl ?? null,
      videoUrl: video.videoUrl ?? null,
      embedUrl: video.embedUrl ?? null,
      description: video.description ?? null,
    });
  }, [isLoaded, isSignedIn, recordFeedWatch]);

  useEffect(() => {
    const root = clipsScrollRef.current;
    if (!clips || !root) return;

    const visibility = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
      const mostVisible = [...visibility.entries()]
        .filter(([, ratio]) => ratio >= 0.5)
        .sort((first, second) => second[1] - first[1])[0]?.[0];
      setActiveClipId(mostVisible?.getAttribute("data-clip-id") ?? null);
    }, { root, threshold: [0, 0.5, 0.75, 1] });

    root.querySelectorAll("[data-clip-card]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [clips, videos]);

  useEffect(() => {
    let isCurrent = true;
    requestIdRef.current += 1;
    const params = new URLSearchParams({ limit: "48", seed: seedVideoId });
    if (search?.trim()) params.set("q", search.trim());
    if (category?.trim()) params.set("category", category.trim());
    if (source) params.set("source", source);
    if (channelId) params.set("channelId", channelId);
    if (clips) params.set("shortForm", "true");

    pageRef.current = 1;
    nextPageTokenRef.current = undefined;
    seenVideoIdsRef.current.clear();
    isFetchingRef.current = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setIsLoading(true);
      setIsLoadingMore(false);
      setHasError(false);
      setHasMore(false);
      setHasLoadMoreError(false);
    });

    fetch(`/api/videos?${params.toString()}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load videos");
        }

        return response.json() as Promise<{ videos: FeedVideo[]; nextPageToken?: string; hasMore?: boolean; source?: string }>;
      })
      .then((data) => {
        if (isCurrent) {
          seenVideoIdsRef.current = new Set(data.videos.map((video) => video.id));
          setVideos(data.videos);
          nextPageTokenRef.current = data.nextPageToken;
          setHasMore(Boolean(data.hasMore));
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      })
      .catch(() => {
        if (isCurrent) {
          setHasError(true);
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [search, category, source, channelId, clips]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || isFetchingRef.current) return;

    const requestId = requestIdRef.current;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setHasLoadMoreError(false);
    const params = new URLSearchParams({
      limit: "48",
      page: String(pageRef.current + 1),
      seed: seedVideoId,
    });
    if (search?.trim()) params.set("q", search.trim());
    if (category?.trim()) params.set("category", category.trim());
    if (source) params.set("source", source);
    if (channelId) params.set("channelId", channelId);
    if (clips) params.set("shortForm", "true");
    if (nextPageTokenRef.current) params.set("pageToken", nextPageTokenRef.current);

    fetch(`/api/videos?${params.toString()}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load more videos");
        return response.json() as Promise<{ videos: FeedVideo[]; nextPageToken?: string; hasMore?: boolean; source?: string }>;
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        const newVideos = data.videos.filter((video) => !seenVideoIdsRef.current.has(video.id));
        newVideos.forEach((video) => seenVideoIdsRef.current.add(video.id));
        setVideos((current) => [...current, ...newVideos]);
        pageRef.current += 1;
        nextPageTokenRef.current = data.nextPageToken;
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setHasLoadMoreError(true);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        isFetchingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [hasMore, search, category, source, channelId, clips]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasLoadMoreError) fetchNextPage();
    }, { rootMargin: "800px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, hasLoadMoreError, fetchNextPage]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading videos...</p>;
  }

  if (hasError) {
    return <p className="text-sm text-destructive">Videos could not be loaded.</p>;
  }

  const normalizedSearch = search?.trim() ?? "";
  const visibleVideos = videos;

  if (normalizedSearch && visibleVideos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">No videos found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a different title or channel name.
        </p>
      </div>
    );
  }

  if (clips && visibleVideos.length === 0 && !hasMore) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <h2 className="font-semibold">No clips available right now</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try again later as new short videos are added.
        </p>
      </div>
    );
  }

  return (
    <>
      {clips && isClipCameraOpen && <ClipCamera onClose={() => setIsClipCameraOpen(false)} />}
      <div ref={clips ? clipsScrollRef : null} className={clips ? "feed-grid clips-feed" : "feed-grid"}>
        {visibleVideos.map((video, index) => {
          const sourceLabel = video.sourceName ?? video.category ?? "Open media";
          const isActiveClip = clips && activeClipId === video.id;
          let autoplayEmbedUrl: string | null = null;

          if (isActiveClip && video.embedUrl && video.sourceId === "twitch" && origin) {
            const twitchClipId = video.id.replace(/^twitch:/, "");
            autoplayEmbedUrl = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(twitchClipId)}&parent=${encodeURIComponent(new URL(origin).hostname)}&autoplay=true&muted=true`;
          } else if (isActiveClip && video.sourceId === "youtube") {
            const youtubeVideoId = video.id.replace(/^youtube:/, "");
            autoplayEmbedUrl = `https://www.youtube.com/embed/${encodeURIComponent(youtubeVideoId)}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${encodeURIComponent(youtubeVideoId)}`;
          } else if (isActiveClip && video.embedUrl && (video.sourceId === "dailymotion" || video.sourceId === "peertube")) {
            const autoplayUrl = new URL(video.embedUrl);
            autoplayUrl.searchParams.set("autoplay", "1");
            autoplayUrl.searchParams.set(video.sourceId === "dailymotion" ? "mute" : "muted", "1");
            autoplayEmbedUrl = autoplayUrl.toString();
          }

          return (
            <article
              key={`${video.id}-${index}`}
              className={clips ? `feed-card feed-clip-card${isActiveClip ? " is-playing" : ""}${areClipDetailsVisible ? "" : " is-details-hidden"}` : "feed-card"}
              data-clip-card={clips ? "true" : undefined}
              data-clip-id={clips ? video.id : undefined}
            >
              {isActiveClip && video.videoUrl ? (
                <video
                  className="feed-clip-player"
                  src={video.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onPlay={() => recordClipWatch(video)}
                />
              ) : isActiveClip && autoplayEmbedUrl ? (
                <iframe
                  className="feed-clip-player"
                  src={autoplayEmbedUrl}
                  title={video.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  loading="eager"
                  onLoad={() => recordClipWatch(video)}
                />
              ) : null}
              {clips && (
                <div className={`feed-clip-topbar${areClipDetailsVisible ? "" : " is-details-hidden"}`}>
                  {areClipDetailsVisible && (
                    <Link className="feed-clip-back" href="/" aria-label="Back to Infinideo">
                      <ArrowLeft aria-hidden="true" />
                      <span>Infinideo</span>
                    </Link>
                  )}
                  <div className="feed-clip-top-actions">
                    {areClipDetailsVisible ? (
                      <>
                        <button
                          className="feed-clip-top-button"
                          type="button"
                          aria-label="Open camera and gallery"
                          onClick={() => setIsClipCameraOpen(true)}
                        >
                          <Camera aria-hidden="true" />
                        </button>
                        <button
                          className="feed-clip-clear-button"
                          type="button"
                          aria-label="Hide clip details"
                          aria-pressed={false}
                          onClick={() => setAreClipDetailsVisible(false)}
                        >
                          Clear view
                        </button>
                      </>
                    ) : (
                      <button
                        className="feed-clip-top-button"
                        type="button"
                        aria-label="Show clip details"
                        aria-pressed
                        onClick={() => setAreClipDetailsVisible(true)}
                      >
                        <Eye aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <Link
                href={`/feed/${video.id.replace(":", "/")}`}
                className="feed-card-open"
                aria-label={`Open video: ${video.title}`}
              >
                <div className="feed-thumbnail-wrap">
                  <img className="feed-thumbnail" src={video.thumbnail} alt={video.title} />
                  <span className="feed-duration">{formatDuration(video.duration)}</span>
                </div>
                {!clips && (
                  <div className="feed-card-body">
                    <div className="feed-avatar">{video.channelTitle.charAt(0).toUpperCase()}</div>
                    <div className="feed-copy">
                      <h2>{video.title}</h2>
                    </div>
                  </div>
                )}
              </Link>

              {clips && (
                <div className="feed-card-body">
                  <div className="feed-avatar">{video.channelTitle.charAt(0).toUpperCase()}</div>
                  <div className="feed-copy">
                    <Link className="feed-clip-title-link" href={`/feed/${video.id.replace(":", "/")}`}>
                      <h2>{video.title}</h2>
                    </Link>
                    {video.description && <p className="feed-clip-description">{video.description}</p>}
                    <div className="feed-clip-meta">
                      {video.channelId ? (
                        <Link className="feed-channel" href={`/creators/${video.channelId}`}>
                          {video.channelTitle}
                        </Link>
                      ) : video.creatorUrl ? (
                        <a className="feed-channel" href={video.creatorUrl} target="_blank" rel="noreferrer">
                          {video.channelTitle}
                        </a>
                      ) : (
                        <p className="feed-channel">{video.channelTitle}</p>
                      )}
                      <p className="feed-meta">
                        {formatViews(video.viewCount)} views · {formatRelativeDate(video.publishedAt)}
                      </p>
                      <div className="feed-source-row">
                        <span className="feed-source">{sourceLabel}</span>
                        {video.license && <span className="feed-license">{video.license}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!clips && <div className="feed-card-details">
                {video.channelId ? (
                  <Link className="feed-channel" href={`/creators/${video.channelId}`}>
                    {video.channelTitle}
                  </Link>
                ) : video.creatorUrl ? (
                  <a className="feed-channel" href={video.creatorUrl} target="_blank" rel="noreferrer">
                    {video.channelTitle}
                  </a>
                ) : (
                  <p className="feed-channel">{video.channelTitle}</p>
                )}
                <p className="feed-meta">
                  {formatViews(video.viewCount)} views • {formatRelativeDate(video.publishedAt)}
                </p>
                <div className="feed-source-row">
                  <span className="feed-source">{sourceLabel}</span>
                  {video.license && <span className="feed-license">{video.license}</span>}
                </div>
              </div>}

              {clips && (
                <div className="feed-clip-actions" aria-label="Clip actions">
                  <button
                    className={`feed-clip-action${likedClipIds.has(video.id) ? " is-liked" : ""}`}
                    type="button"
                    aria-label={likedClipIds.has(video.id) ? `Unlike ${video.title}` : `Like ${video.title}`}
                    aria-pressed={likedClipIds.has(video.id)}
                    onClick={() => toggleClipLike(video.id)}
                  >
                    <Heart aria-hidden="true" fill={likedClipIds.has(video.id) ? "currentColor" : "none"} />
                    <span>{likedClipIds.has(video.id) ? "Liked" : "Like"}</span>
                  </button>
                  <button
                    className="feed-clip-action"
                    type="button"
                    aria-label={`Share ${video.title}`}
                    onClick={() => void shareClip(video)}
                  >
                    <Share2 aria-hidden="true" />
                    <span>Share</span>
                  </button>
                  <a
                    className="feed-clip-action"
                    href={video.sourceUrl ?? video.creatorUrl ?? `/feed/${video.id.replace(":", "/")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open source for ${video.title}`}
                  >
                    <ExternalLink aria-hidden="true" />
                    <span>Source</span>
                  </a>
                </div>
              )}
            </article>
          );
        })}
        {clips && (
          <div ref={loadMoreRef} className="feed-load-more feed-clips-load-more" aria-live="polite">
            <span className="feed-load-more-status">
              {isLoadingMore ? "Loading more videos..." : hasLoadMoreError ? "Could not load more videos." : hasMore ? "Scroll for more" : "You reached the end"}
            </span>
            {hasMore && !isLoadingMore && (
              <button className="feed-load-more-button" type="button" onClick={fetchNextPage} disabled={isLoadingMore}>
                {hasLoadMoreError ? "Retry loading videos" : "Load more videos"}
              </button>
            )}
          </div>
        )}
      </div>
      {!clips && (
        <div ref={loadMoreRef} className="feed-load-more" aria-live="polite">
          <span className="feed-load-more-status">
            {isLoadingMore ? "Loading more videos..." : hasLoadMoreError ? "Could not load more videos." : hasMore ? "Scroll for more" : "You reached the end"}
          </span>
          {hasMore && !isLoadingMore && (
            <button className="feed-load-more-button" type="button" onClick={fetchNextPage} disabled={isLoadingMore}>
              {hasLoadMoreError ? "Retry loading videos" : "Load more videos"}
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Feed;
