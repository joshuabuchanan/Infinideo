"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";

import { InfiniteScroll } from "@/components/infinite-scroll";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";

interface ResultsSectionProps {
  query: string | undefined;
  categoryId: string | undefined;
};

export const ResultsSection = (props: ResultsSectionProps) => {
  return (
    <Suspense 
      key={`${props.query}-${props.categoryId}`}  
      fallback={<ResultsSectionSkeleton />}
    >
      <ErrorBoundary fallback={<p>Error</p>}>
        <ResultsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const ResultsSectionSkeleton = () => {
  return (
    <div>
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} />
        ))}
      </div>
      <div className="flex flex-col gap-4 p-4 gap-y-10 pt-6 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

const ResultsSectionSuspense = ({
  query,
  categoryId,
}: ResultsSectionProps) => {
  const [results, resultsQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
    { query, categoryId, limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const resultVideos = results.pages.flatMap((page) => page.items);

  if (query?.trim() && resultVideos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-8 text-center">
        <p className="font-medium">No Infinideo uploads match this search</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check the web results below or try another title or creator.
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
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {resultVideos.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {resultVideos.map((video) => (
            <VideoRowCard key={video.id} data={video} />
          ))
        }
      </div>
      <InfiniteScroll
        hasNextPage={resultsQuery.hasNextPage}
        isFetchingNextPage={resultsQuery.isFetchingNextPage}
        fetchNextPage={resultsQuery.fetchNextPage}
      />
    </>
  )
}