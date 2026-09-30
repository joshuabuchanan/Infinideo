"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";
import { Trash2Icon } from "lucide-react";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { toast } from "sonner";

interface VideosSectionProps {
  playlistId: string;
}

export const VideosSection = (props: VideosSectionProps) => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideosSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const VideosSectionSkeleton = () => {
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

const VideosSectionSuspense = ({ playlistId }: VideosSectionProps) => {
  const [videos, query] = trpc.playlists.getVideos.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT, playlistId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const [feedVideos, feedQuery] = trpc.playlists.getFeedVideos.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT, playlistId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const utils = trpc.useUtils();

  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: (data) => {
      toast.success("Video removed from playlist");
      utils.playlists.getMany.invalidate();
      utils.playlists.getManyForVideo.invalidate({ videoId: data.videoId });
      utils.playlists.getOne.invalidate({ id: data.playlistId })
      utils.playlists.getVideos.invalidate({ playlistId: data.playlistId })
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  const removeFeedVideo = trpc.playlists.removeFeedVideo.useMutation({
    onSuccess: async (entry) => {
      toast.success("Video removed from playlist");
      await Promise.all([
        utils.playlists.getMany.invalidate(),
        utils.playlists.getManyForFeedVideo.invalidate({ sourceId: entry.sourceId, videoId: entry.videoId }),
        utils.playlists.getFeedVideos.invalidate({ playlistId: entry.playlistId }),
      ]);
    },
    onError: () => toast.error("Could not remove video from playlist"),
  });

  const playlistVideos = videos.pages.flatMap((page) => page.items);
  const playlistFeedVideos = feedVideos.pages.flatMap((page) => page.items);

  if (playlistVideos.length === 0 && playlistFeedVideos.length === 0) {
    return (
      <div className="border-y border-border/70 py-10 text-center">
        <p className="font-medium">This playlist is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a video from its menu to start building this playlist.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {playlistVideos.map((video) => (
            <VideoGridCard 
              key={video.id} 
              data={video} 
              onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })} />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {playlistVideos.map((video) => (
            <VideoRowCard 
              key={video.id} 
              data={video} 
              size="compact" 
              onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })}
            />
          ))
        }
      </div>
      {playlistFeedVideos.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Other videos</h2>
          <div className="flex flex-col gap-4">
            {playlistFeedVideos.map((video) => {
              const routeId = video.videoId.includes(":")
                ? video.videoId.replace(":", "/")
                : `${video.sourceId}/${video.videoId}`;

              return (
                <article key={`${video.sourceId}:${video.videoId}`} className="flex min-w-0 items-center gap-3 border-b border-border/60 pb-4">
                  <Link href={`/feed/${routeId}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <img className="h-20 w-36 shrink-0 rounded-md object-cover" src={video.thumbnail} alt="" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium">{video.title}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{video.channelTitle} · {video.sourceId}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${video.title} from playlist`}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    disabled={removeFeedVideo.isPending}
                    onClick={() => removeFeedVideo.mutate({ playlistId, sourceId: video.sourceId, videoId: video.videoId })}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </article>
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