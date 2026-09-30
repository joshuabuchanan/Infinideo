"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";

export const HistoryVideosSection = () => {
  return (
    <Suspense fallback={<HistoryVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <HistoryVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const HistoryVideosSectionSkeleton = () => {
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

const HistoryVideosSectionSuspense = () => {
  const [videos, query] = trpc.playlists.getHistory.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const historyVideos = videos.pages.flatMap((page) => page.items);
  const [feedHistory, feedQuery] = trpc.feedVideoHistory.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const feedHistoryVideos = feedHistory.pages.flatMap((page) => page.items);

  if (historyVideos.length === 0 && feedHistoryVideos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <p className="font-medium">Your watch history is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Videos you watch will show up here.
        </p>
        <Link
          href="/explore"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse videos
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {historyVideos.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {historyVideos.map((video) => (
            <VideoRowCard key={video.id} data={video} size="compact" />
          ))
        }
      </div>
      {feedHistoryVideos.length > 0 && (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Other watched videos</h2>
          <div className="flex flex-col gap-4">
            {feedHistoryVideos.map((video) => {
              const routeId = video.videoId.includes(":")
                ? video.videoId.replace(":", "/")
                : `${video.sourceId}/${video.videoId}`;

              return (
                <Link
                  key={`${video.sourceId}:${video.videoId}`}
                  href={`/feed/${routeId}`}
                  className="flex gap-4 rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/40"
                >
                  <img className="h-20 w-36 shrink-0 rounded-md object-cover" src={video.thumbnail} alt="" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-medium">{video.title}</span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">{video.channelTitle}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Watched {video.watchedAt.toLocaleDateString()}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <InfiniteScroll
            hasNextPage={feedQuery.hasNextPage}
            isFetchingNextPage={feedQuery.isFetchingNextPage}
            fetchNextPage={feedQuery.fetchNextPage}
          />
        </section>
      )}
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  )
}