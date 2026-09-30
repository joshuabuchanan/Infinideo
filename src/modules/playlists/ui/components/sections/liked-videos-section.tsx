"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";

export const LikedVideosSection = () => {
  return (
    <ErrorBoundary fallback={<p>Error</p>}>
      <LikedVideosSectionSuspense />
    </ErrorBoundary>
  );
};

const LikedVideosSectionSkeleton = () => {
  return (
    <div>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({ length: 18 }).map((_, index) => (
            <VideoGridCardSkeleton key={index} />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 18 }).map((_, index) => (
            <VideoRowCardSkeleton key={index} size="compact" />
          ))
        }
      </div>
    </div>
  )
}

const LikedVideosSectionSuspense = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const feedQuery = trpc.feedVideoLikes.getMany.useQuery(undefined, {
    enabled: isLoaded && Boolean(isSignedIn),
  });
  const query = trpc.playlists.getLiked.useInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      enabled: isLoaded && isSignedIn,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const likedVideos = query.data?.pages.flatMap((page) => page.items) ?? [];
  const likedFeedVideos = feedQuery.data ?? [];

  if (!isLoaded || query.isLoading || (isSignedIn && feedQuery.isLoading)) {
    return <LikedVideosSectionSkeleton />;
  }

  if (query.isError || feedQuery.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load liked videos. Please try again.
      </p>
    );
  }

  if (likedVideos.length === 0 && likedFeedVideos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <p className="font-medium">No liked videos yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Videos you like will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {likedFeedVideos.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          {likedFeedVideos.map((video) => (
            <Link
              key={`${video.sourceId}:${video.videoId}`}
              href={`/feed/${encodeURIComponent(video.videoId)}`}
              className="flex gap-3 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:bg-muted/60"
            >
              <Image
                src={video.thumbnail}
                alt=""
                width={416}
                height={234}
                unoptimized
                loading="lazy"
                decoding="async"
                className="aspect-video w-36 shrink-0 rounded-md bg-muted object-cover sm:w-52"
              />
              <div className="min-w-0 self-center">
                <h2 className="line-clamp-2 font-semibold">{video.title}</h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">{video.channelTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Number(video.viewCount).toLocaleString()} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {likedVideos.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {likedVideos.map((video) => (
            <VideoRowCard key={video.id} data={video} size="compact" />
          ))
        }
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  )
}