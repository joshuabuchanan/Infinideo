"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";

export const SubscribedVideosSection = () => {
  return (
    <Suspense fallback={<SubscribedVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SubscribedVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const SubscribedVideosSectionSkeleton = () => {
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
            <VideoGridCardSkeleton key={index} />
          ))
        }
      </div>
  )
}

const SubscribedVideosSectionSuspense = () => {
  const [videos, query] = trpc.videos.getManySubscribed.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const subscribedVideos = videos.pages.flatMap((page) => page.items);

  if (subscribedVideos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <p className="font-medium">No videos from your subscriptions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow a creator to see their latest uploads here.
        </p>
        <Link
          href="/explore"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Explore videos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6">
        {subscribedVideos.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))
        }
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}