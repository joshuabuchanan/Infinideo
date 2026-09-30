"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { JSX } from "react";
import { format } from "date-fns";
import { Globe2Icon, LockIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { useAuth } from "@clerk/nextjs";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { snakeCaseToTitle } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";

export const VideosSection = (): JSX.Element => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <VideosSectionSkeleton />;
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Sign in to view and manage your videos.
      </div>
    );
  }

  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  )
};

const VideosSectionSkeleton = (): JSX.Element => {
  return (
    <>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-127.5 pl-6">Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-20 w-36" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-25" />
                        <Skeleton className="h-3 w-37.5" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
      </div>
    </>
  )
}

function VideosSectionSuspense(): JSX.Element {
  const { data: videos, hasNextPage, isFetchingNextPage, fetchNextPage } = trpc.studio.getMany.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (!videos) {
    return <VideosSectionSkeleton />;
  }

  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-127.5 pl-6">Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.pages.flatMap((page) => page.items).map((video) => (
              <TableRow className="cursor-pointer" key={video.id}>
                <TableCell className="pl-6">
                  <Link prefetch href={`/studio/videos/${video.id}`} className="flex items-center gap-4">
                    <div className="relative w-36 shrink-0">
                      <VideoThumbnail
                        imageUrl={video.thumbnailUrl}
                        previewUrl={video.previewUrl}
                        playbackId={video.muxPlaybackId}
                        title={video.title}
                        duration={video.duration}
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden gap-y-1">
                      <span className="text-sm line-clamp-1">{video.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {video.description || "No description"}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {video.visibility === "private" ? (
                        <LockIcon className="size-4 mr-2" />
                      ): (
                        <Globe2Icon className="size-4 mr-2" />
                      )}
                      {snakeCaseToTitle(video.visibility)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {snakeCaseToTitle(video.muxStatus || "error")}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm truncate">
                    {format(new Date(video.createdAt), "d MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {video.viewCount}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {video.commentCount}
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6">
                    {video.likeCount}
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <InfiniteScroll
        isManual
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  );
}
