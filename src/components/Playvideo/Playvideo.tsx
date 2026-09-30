'use client';

import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Check, Link as LinkIcon, ListPlus, MessageCircle, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import YouTube from "react-youtube";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import type { FeedVideo } from "@/lib/feed-videos";
import { FeedPlaylistAddModal } from "@/modules/playlists/ui/components/feed-playlist-add-modal";
import { getYouTubeEmbedUrl, normalizeYouTubeVideoId } from "@/lib/youtube";
import "./Playvideo.css";

interface PlayVideoProps {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  duration?: string;
  thumbnail?: string;
  videoUrl?: string;
  embedUrl?: string;
  creator?: string;
  license?: string;
  licenseUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  thumbnailAttribution?: string;
  sourceId?: string;
}

interface VideoDetails {
  title: string;
  channelTitle: string;
  viewCount: string;
  concurrentViewers?: string;
}

export default function PlayVideo({
  videoId,
  title,
  channelTitle,
  viewCount,
  publishedAt,
  duration,
  thumbnail,
  videoUrl,
  embedUrl: sourceEmbedUrl,
  creator,
  license,
  licenseUrl,
  sourceName,
  sourceUrl,
  thumbnailAttribution,
  sourceId = "internet-archive",
}: PlayVideoProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const [videoDetails, setVideoDetails] = useState<VideoDetails>({
    title,
    channelTitle,
    viewCount,
  });
  const isExternalDocumentarySource = sourceId === "ihavenotv";
  const [playerMode, setPlayerMode] = useState<"youtube" | "error">("youtube");
  const [playerErrorCode, setPlayerErrorCode] = useState<number | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [origin, setOrigin] = useState("");
  const [isDisliked, setIsDisliked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [loadedFeedVideoId, setLoadedFeedVideoId] = useState<string | null>(null);
  const isDbVideoId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(videoId);
  const recordedFeedWatchRef = useRef<{ videoId: string; recorded: boolean }>({ videoId, recorded: false });
  const recordFeedWatch = trpc.feedVideoHistory.record.useMutation({
    onSuccess: () => {
      void utils.feedVideoHistory.getMany.invalidate();
    },
  });
  const feedLikeQuery = trpc.feedVideoLikes.getStatus.useQuery(
    { sourceId, videoId },
    { enabled: isLoaded && Boolean(isSignedIn) && !isDbVideoId },
  );
  const feedSaveQuery = trpc.feedVideoSaves.getStatus.useQuery(
    { sourceId, videoId },
    { enabled: isLoaded && Boolean(isSignedIn) },
  );
  const dbVideoQuery = trpc.videos.getOne.useQuery(
    { id: videoId },
    { enabled: isDbVideoId, retry: false },
  );
  const setFeedLiked = trpc.feedVideoLikes.setLiked.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.feedVideoLikes.getStatus.invalidate({ sourceId, videoId }),
        utils.feedVideoLikes.getMany.invalidate(),
      ]);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("Sign in to save liked videos");
        clerk.openSignIn();
        return;
      }
      toast.error("Could not save this like");
    },
  });
  const setFeedSaved = trpc.feedVideoSaves.setSaved.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.feedVideoSaves.getStatus.invalidate({ sourceId, videoId }),
        utils.feedVideoSaves.getMany.invalidate(),
      ]);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("Sign in to save videos for later");
        clerk.openSignIn();
        return;
      }
      toast.error("Could not update Watch Later");
    },
  });
  const likeDbVideo = trpc.videoReactions.like.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.videos.getOne.invalidate({ id: videoId }),
        utils.playlists.getLiked.invalidate(),
      ]);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("Sign in to save liked videos");
        clerk.openSignIn();
        return;
      }
      toast.error("Could not save this like");
    },
  });
  const isLiked = isDbVideoId
    ? dbVideoQuery.data?.viewerReaction === "like"
    : feedLikeQuery.data?.isLiked ?? false;
  const isSaved = feedSaveQuery.data?.isSaved ?? false;
  const { data: commentPage, isLoading: isCommentsLoading } = trpc.comments.getMany.useQuery(
    { videoId, limit: 20 },
    { enabled: isDbVideoId, retry: false },
  );
  const comments = (commentPage?.items ?? []).map((comment) => ({
    id: comment.id,
    author: comment.user.name,
    authorClerkId: comment.user.clerkId,
    isVideoOwner: comment.isVideoOwner,
    time: formatDistanceToNow(comment.createdAt, { addSuffix: true }),
    text: comment.value,
    likes: comment.likeCount,
  }));
  function markFeedVideoWatched() {
    setLoadedFeedVideoId(videoId);
  }

  useEffect(() => {
    if (loadedFeedVideoId !== videoId || isDbVideoId || !isLoaded || !isSignedIn) return;
    if (recordedFeedWatchRef.current.videoId === videoId && recordedFeedWatchRef.current.recorded) return;

    recordedFeedWatchRef.current = { videoId, recorded: true };
    recordFeedWatch.mutate({
      sourceId,
      videoId,
      title,
      channelTitle,
      thumbnail: thumbnail ?? "",
      publishedAt,
      viewCount,
      duration: duration ?? "",
      sourceUrl: sourceUrl ?? null,
      videoUrl: videoUrl ?? null,
      embedUrl: sourceEmbedUrl ?? null,
      description: null,
    });
  }, [channelTitle, duration, isDbVideoId, isLoaded, isSignedIn, loadedFeedVideoId, publishedAt, recordFeedWatch, sourceEmbedUrl, sourceId, sourceUrl, thumbnail, title, videoId, videoUrl, viewCount]);

  const removeComment = trpc.comments.remove.useMutation({
    onSuccess: async () => {
      toast.success("Comment deleted");
      await utils.comments.getMany.invalidate({ videoId });
    },
    onError: () => toast.error("Could not delete comment"),
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const embedUrl = getYouTubeEmbedUrl(videoId, origin);
  const normalizedYouTubeVideoId = normalizeYouTubeVideoId(videoId);
  const twitchClipId = videoId.replace(/^twitch:/, "");
  const twitchEmbedUrl = origin && sourceId === "twitch"
    ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(twitchClipId)}&parent=${encodeURIComponent(new URL(origin).hostname)}&autoplay=false`
    : null;
  const providerEmbedUrl = sourceId === "dailymotion" || sourceId === "peertube"
    ? sourceEmbedUrl
    : null;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !origin || !embedUrl) return;

    console.debug("YouTube player diagnostics", {
      videoId,
      origin,
      embedUrl,
      playerMode,
    });
  }, [embedUrl, origin, playerMode, videoId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshVideoData() {
      try {
        const response = await fetch(`/api/videos?videoId=${encodeURIComponent(videoId)}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          videos?: Array<VideoDetails & { id: string }>;
        };
        const currentVideo = data.videos?.find((video) => video.id === videoId);

        if (!cancelled && currentVideo) {
          setVideoDetails({
            title: currentVideo.title,
            channelTitle: currentVideo.channelTitle,
            viewCount: currentVideo.viewCount,
            concurrentViewers: currentVideo.concurrentViewers,
          });
        }
      } catch {
        // Keep the server-provided fallback details when the request fails.
      }
    }

    void refreshVideoData();
    const intervalId = window.setInterval(refreshVideoData, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [videoId]);

  useEffect(() => {
    const player = document.querySelector<HTMLVideoElement>(`.play-video[data-video-id="${videoId}"] video`);
    if (!player) return;

    let lastProgressCheckpoint = -1;
    const track = (event: string) => {
      if (window.localStorage.getItem("infinideo-analytics-consent") !== "granted") return;

      void fetch("/api/analytics/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event,
          videoId,
          source: sourceId,
          positionSeconds: player.currentTime,
        }),
        keepalive: true,
      });
    };

    const onPlay = () => track("play");
    const onPause = () => track("pause");
    const onEnded = () => track("complete");
    const onTimeUpdate = () => {
      const checkpoint = Math.floor(player.currentTime / 30);
      if (checkpoint > 0 && checkpoint !== lastProgressCheckpoint) {
        lastProgressCheckpoint = checkpoint;
        track("progress");
      }
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    player.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [sourceId, videoId, videoUrl]);

  async function copyVideoLink() {
    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  }

  function toggleLike() {
    if (!isLoaded || !isSignedIn) {
      clerk.openSignIn();
      return;
    }

    if (isDbVideoId) {
      likeDbVideo.mutate({ videoId });
      return;
    }

    setFeedLiked.mutate({
      sourceId,
      videoId,
      title,
      channelTitle,
      thumbnail: thumbnail ?? "",
      publishedAt,
      viewCount,
      duration: duration ?? "",
      sourceUrl: sourceUrl ?? null,
      videoUrl: videoUrl ?? null,
      embedUrl: sourceEmbedUrl ?? null,
      description: null,
      liked: !isLiked,
    });
  }

  function toggleSaved() {
    if (!isLoaded || !isSignedIn) {
      toast.error("Sign in to save videos for later");
      clerk.openSignIn();
      return;
    }

    setFeedSaved.mutate({
      sourceId,
      videoId,
      title,
      channelTitle,
      thumbnail: thumbnail ?? "",
      publishedAt,
      viewCount,
      duration: duration ?? "",
      sourceUrl: sourceUrl ?? null,
      videoUrl: videoUrl ?? null,
      embedUrl: sourceEmbedUrl ?? null,
      description: null,
      saved: !isSaved,
    });
  }

  function handlePlayerError(event: { data: number }) {
    setPlayerErrorCode(event.data);
    setPlayerMode("error");

    if (process.env.NODE_ENV === "development") {
      console.error("YouTube Player Error:", event.data);
    }
  }

  function retryPlayer() {
    setPlayerErrorCode(null);
    setPlayerMode("youtube");
    setPlayerKey((key) => key + 1);
  }

  function handleAddComment() {
    if (!isDbVideoId) return;

    const trimmed = commentDraft.trim();
    if (!trimmed) return;

    setCommentDraft("");
  }

  function getPlayerErrorMessage() {
    switch (playerErrorCode) {
      case 100:
        return "This video is unavailable or private.";
      case 101:
      case 150:
        return "The video owner does not allow this video to play here.";
      case 153:
        return "YouTube could not identify this application. Try again, or watch the video directly on YouTube.";
      case 5:
        return "YouTube could not play this video right now. Please try again.";
      default:
        return "This video could not be played in the embedded player.";
    }
  }

  return (
    <section className="play-video" data-video-id={videoId}>
      {!isDbVideoId && (
        <FeedPlaylistAddModal
          open={isPlaylistModalOpen}
          onOpenChange={setIsPlaylistModalOpen}
          video={{
            id: videoId,
            sourceId: sourceId as FeedVideo["sourceId"],
            title,
            channelTitle,
            thumbnail: thumbnail ?? "",
            publishedAt,
            viewCount,
            duration: duration ?? "",
            sourceUrl,
            videoUrl,
            embedUrl: sourceEmbedUrl,
          }}
        />
      )}
      <div className="play-video-frame">
        {sourceId === "twitch" ? (
          twitchEmbedUrl ? (
            <iframe
              className="play-video-iframe"
              src={twitchEmbedUrl}
              title={videoDetails.title}
              allowFullScreen
              loading="eager"
              onLoad={markFeedVideoWatched}
            />
          ) : (
            <div className="play-video-error" aria-label="Loading video player" />
          )
        ) : providerEmbedUrl ? (
          <iframe
            className="play-video-iframe"
            src={providerEmbedUrl}
            title={videoDetails.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="eager"
            onLoad={markFeedVideoWatched}
          />
        ) : videoUrl ? (
          <video className="play-video-iframe" src={videoUrl} controls playsInline preload="metadata" onPlay={markFeedVideoWatched}>
            Your browser does not support embedded video.
          </video>
        ) : isExternalDocumentarySource && sourceUrl ? (
          <div className="play-video-error">
            <p>This documentary is hosted on I Have Not TV.</p>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Open documentary
            </a>
          </div>
        ) : playerMode === "error" ? (
          <div className="play-video-error">
            <p>{getPlayerErrorMessage()}</p>
            {playerErrorCode === 101 || playerErrorCode === 150 ? (
              <a href={`https://www.youtube.com/watch?v=${normalizedYouTubeVideoId ?? videoId}`} target="_blank" rel="noreferrer">
                Watch on YouTube
              </a>
            ) : null}
            <button type="button" onClick={retryPlayer}>
              Retry
            </button>
          </div>
        ) : !origin || !embedUrl ? (
          <div className="play-video-error" aria-label="Loading video player" />
        ) : (
          <YouTube
            key={playerKey}
            videoId={normalizedYouTubeVideoId ?? videoId}
            className="play-video-youtube"
            iframeClassName="play-video-iframe"
            title={videoDetails.title}
            loading="eager"
            onError={handlePlayerError}
            onStateChange={(event) => {
              if (event.data === 1) markFeedVideoWatched();
            }}
            opts={{
              height: "100%",
              width: "100%",
              playerVars: {
                autoplay: 0,
                controls: 1,
                playsinline: 1,
                rel: 0,
                origin,
              },
            }}
          />
        )}
      </div>

      {videoUrl || sourceId === "twitch" || providerEmbedUrl ? (
        sourceUrl ? (
          <a className="play-video-youtube-link" href={sourceUrl} target="_blank" rel="noreferrer">
            {sourceId === "twitch"
              ? "View clip on Twitch"
              : sourceId === "dailymotion"
                ? "Watch on Dailymotion"
                : sourceId === "peertube"
                  ? "Watch on PeerTube"
                  : "View original source"}
          </a>
        ) : null
      ) : (
        <a
          className="play-video-youtube-link"
          href={`https://www.youtube.com/watch?v=${normalizedYouTubeVideoId ?? videoId}`}
          target="_blank"
          rel="noreferrer"
        >
          Watch on YouTube
        </a>
      )}

      <h1>{videoDetails.title}</h1>
      <div className="play-video-info-row">
        <p className="play-video-meta">
          {videoDetails.channelTitle} · {Number(videoDetails.viewCount).toLocaleString()} views · {publishedAt}
          {videoDetails.concurrentViewers
            ? ` · ${Number(videoDetails.concurrentViewers).toLocaleString()} watching now`
            : ""}
        </p>

        <div className="play-video-actions" aria-label="Video actions">
          <button
            type="button"
            className={isLiked ? "is-active" : ""}
            onClick={toggleLike}
            disabled={setFeedLiked.isPending || likeDbVideo.isPending}
          >
            <ThumbsUp size={17} fill={isLiked ? "currentColor" : "none"} />
            {isLiked ? "Liked" : "Like"}
          </button>
          <button
            type="button"
            className={isDisliked ? "is-active" : ""}
            onClick={() => setIsDisliked((value) => !value)}
          >
            <ThumbsDown size={17} fill={isDisliked ? "currentColor" : "none"} />
            {isDisliked ? "Disliked" : "Dislike"}
          </button>
          <button type="button" onClick={() => void copyVideoLink()}>
            {isCopied ? <Check size={17} /> : <LinkIcon size={17} />}
            {isCopied ? "Copied" : "Share"}
          </button>
          {!isDbVideoId && (
            <button type="button" onClick={() => setIsPlaylistModalOpen(true)}>
              <ListPlus size={17} />
              Playlist
            </button>
          )}
          <button
            type="button"
            className={isSaved ? "is-active" : ""}
            onClick={toggleSaved}
            disabled={setFeedSaved.isPending}
          >
            {isSaved ? <Check size={17} /> : <Bookmark size={17} />}
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {(sourceName || creator || license) && (
        <div className="play-video-attribution">
          <strong>Open media attribution</strong>
          <p>
            {creator ? `Created by ${creator}` : "Open media"}
            {sourceName ? ` · Source: ${sourceName}` : ""}
          </p>
          <p>
            {licenseUrl ? (
              <a href={licenseUrl} target="_blank" rel="noreferrer">
                {license ?? "License details"}
              </a>
            ) : (
              license
            )}
            {sourceUrl ? (
              <>
                {" · "}
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  View source
                </a>
              </>
            ) : null}
          </p>
          {thumbnailAttribution ? <p>Thumbnail: {thumbnailAttribution}</p> : null}
        </div>
      )}

      <div className="play-video-comments">
        <div className="play-video-comments-header">
          <h2>{isCommentsLoading ? "Loading comments..." : `${comments.length} Comments`}</h2>
        </div>

        {isDbVideoId && (
          <div className="play-video-comment-compose">
            <div className="play-video-comment-avatar">Y</div>
            <div className="play-video-comment-form">
              <textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Add a comment..."
                rows={1}
              />
              <div className="play-video-comment-actions">
                <button type="button" className="play-video-comment-cancel" onClick={() => setCommentDraft("")}>
                  Cancel
                </button>
                <button type="button" className="play-video-comment-submit" onClick={handleAddComment}>
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}

        {isDbVideoId && (
          <div className="play-video-comment-list">
            {comments.length === 0 ? (
              <p className="play-video-comment-empty">No comments yet. Be the first to comment.</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="play-video-comment-item">
                  <div className="play-video-comment-avatar play-video-comment-avatar--small">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="play-video-comment-body">
                    <div className="play-video-comment-meta">
                      <strong>{comment.author}</strong>
                      <span>{comment.time}</span>
                      {(comment.authorClerkId === userId || comment.isVideoOwner) && (
                        <button
                          type="button"
                          aria-label="Delete comment"
                          disabled={removeComment.isPending}
                          onClick={() => removeComment.mutate({ id: comment.id })}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p>{comment.text}</p>
                    <div className="play-video-comment-feedback">
                      <button type="button" aria-label="Like comment">
                        <ThumbsUp size={14} />
                        <span>{comment.likes}</span>
                      </button>
                      <button type="button" aria-label="Dislike comment">
                        <ThumbsDown size={14} />
                      </button>
                      <button type="button" aria-label="Reply to comment">
                        <MessageCircle size={14} />
                        Reply
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
        {!isDbVideoId && (
          <p className="play-video-comment-empty">Comments are only available for app-backed videos.</p>
        )}
      </div>
    </section>
  );
}
