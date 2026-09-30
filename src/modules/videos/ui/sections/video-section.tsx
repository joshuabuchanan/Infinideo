"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/copy-text-to-clipboard";
import { useAppOrigin } from "@/hooks/use-app-origin";
import { trpc } from "@/trpc/client";

import { VideoBanner } from "../components/video-banner";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { VideoTopRow, VideoTopRowSkeleton } from "../components/video-top-row";
import { VideoForm, VideoFormSkeleton } from "@/modules/studio/ui/components/video-form";

interface VideoSectionProps {
  videoId: string;
}

export const VideoSection = ({ videoId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideoSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  )
};

export const VideoSectionSkeleton = () => {
  return (
    <>
      <VideoPlayerSkeleton />
      <VideoTopRowSkeleton />
      <VideoFormSkeleton />
    </>
  )
}

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const recordedViewRef = useRef<string | null>(null);
  const appOrigin = useAppOrigin();

  const utils = trpc.useUtils();
  const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
  const createView = trpc.videoViews.create.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
      utils.videos.getMany.invalidate();
      utils.videos.getManyTrending.invalidate();
      utils.videos.getManySubscribed.invalidate();
      utils.search.getMany.invalidate();
      utils.suggestions.getMany.invalidate({ videoId });
      utils.studio.getMany.invalidate();
      void utils.categories.getSuggested.invalidate();
      void utils.playlists.getHistory.invalidate();
    },
  });
  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },
  });

  const handlePlay = () => {
    if (recordedViewRef.current === videoId) return;

    recordedViewRef.current = videoId;
    createView.mutate({ videoId });
  };

  const videoUrl = `/videos/${videoId}`;
  const fullVideoUrl = `${appOrigin}${videoUrl}`;

  const handleCopy = async () => {
    await copyTextToClipboard(`${window.location.origin}${videoUrl}`);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div className="space-y-8">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)]">
        <div className="min-w-0">
          <VideoTopRow video={video} />
          <VideoForm video={video} />
        </div>
        <aside className="order-first space-y-3 lg:order-last lg:sticky lg:top-6">
          <div className={cn(
            "relative aspect-video overflow-hidden rounded-2xl bg-background shadow-xl shadow-foreground/10 ring-1 ring-border",
            video.muxStatus !== "ready" && "rounded-b-none",
          )}>
            <VideoPlayer
              autoPlay
              onPlay={handlePlay}
              playbackId={video.muxPlaybackId}
              thumbnailUrl={video.thumbnailUrl}
              status={video.muxStatus}
            />
          </div>
          <VideoBanner
            status={video.muxStatus}
            onRevalidate={() => revalidate.mutate({ id: videoId })}
            isRevalidating={revalidate.isPending}
          />
          <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Video link</p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={videoUrl}
                target="_blank"
                className="min-w-0 flex-1 truncate text-sm text-secondary hover:underline"
              >
                {fullVideoUrl}
              </Link>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={isCopied ? "Video link copied" : "Copy video link"}
              >
                {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              </button>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-border/70 pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Video status</dt>
                <dd className="mt-1 font-medium capitalize">{video.muxStatus || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Subtitles status</dt>
                <dd className="mt-1 font-medium">Not added</dd>
              </div>
            </dl>
            <Link
              href={videoUrl}
              className="mt-5 inline-flex items-center gap-2 border-t border-border/70 pt-4 text-sm font-semibold text-foreground hover:text-secondary"
            >
              <ExternalLinkIcon className="size-4" />
              Exit studio
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
};