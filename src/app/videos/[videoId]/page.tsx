"use client";

import { Suspense } from "react";
import { use } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { VideoBanner } from "@/modules/videos/ui/components/video-banner";
import { VideoPlayer, VideoPlayerSkeleton } from "@/modules/videos/ui/components/video-player";
import { VideoTopRow, VideoTopRowSkeleton } from "@/modules/videos/ui/components/video-top-row";
import { CommentsSection } from "@/modules/videos/ui/sections/comments-section";

interface PublicVideoPageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export default function PublicVideoPage({ params }: PublicVideoPageProps) {
  return (
    <Suspense fallback={<PublicVideoPageSkeleton />}>
      <PublicVideoPageContent params={params} />
    </Suspense>
  );
}

function PublicVideoPageSkeleton() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <VideoPlayerSkeleton />
      <VideoTopRowSkeleton />
    </main>
  );
}

function PublicVideoPageContent({ params }: PublicVideoPageProps) {
  const { videoId } = use(params);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <PublicVideoContent videoId={videoId} />
      <CommentsSection videoId={videoId} />
    </main>
  );
}

function PublicVideoContent({ videoId }: { videoId: string }) {
  const { isSignedIn } = useAuth();
  const utils = trpc.useUtils();
  const videoQuery = trpc.videos.getOne.useQuery({ id: videoId }, { retry: false });
  const createView = trpc.videoViews.create.useMutation({
    onSuccess: () => utils.videos.getOne.invalidate({ id: videoId }),
  });
  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => utils.videos.getOne.invalidate({ id: videoId }),
  });

  if (videoQuery.isLoading) {
    return <PublicVideoPageSkeleton />;
  }

  if (videoQuery.error) {
    return (
      <>
        <Link href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Studio
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-lg font-semibold">Video unavailable.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This video could not be found or is no longer available.
          </p>
        </div>
      </>
    );
  }

  const video = videoQuery.data;

  if (!video) {
    return (
      <>
        <Link href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Studio
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-lg font-semibold">Video unavailable.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This video could not be found or is no longer available.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Link href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
        Back to Studio
      </Link>
      <div className={cn(
        "relative aspect-video overflow-hidden rounded-2xl bg-black",
        video.muxStatus !== "ready" && "rounded-b-none",
      )}>
        <VideoPlayer
          autoPlay={false}
          onPlay={() => {
            if (isSignedIn) createView.mutate({ videoId });
          }}
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
      <VideoTopRow video={video} />
    </>
  );
}
