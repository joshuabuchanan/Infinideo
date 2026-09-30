"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon, SquareCheckIcon, SquareIcon } from "lucide-react";

import type { FeedVideo } from "@/lib/feed-videos";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { InfiniteScroll } from "@/components/infinite-scroll";

interface FeedPlaylistAddModalProps {
  video: FeedVideo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedPlaylistAddModal = ({ video, open, onOpenChange }: FeedPlaylistAddModalProps) => {
  const sourceId = video.sourceId ?? "internet-archive";
  const [isCreating, setIsCreating] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const utils = trpc.useUtils();
  const playlists = trpc.playlists.getManyForFeedVideo.useInfiniteQuery(
    { sourceId, videoId: video.id, limit: DEFAULT_LIMIT },
    {
      enabled: open,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const invalidate = async (playlistId?: string) => {
    await Promise.all([
      utils.playlists.getMany.invalidate(),
      utils.playlists.getManyForFeedVideo.invalidate({ sourceId, videoId: video.id }),
      playlistId ? utils.playlists.getFeedVideos.invalidate({ playlistId }) : Promise.resolve(),
    ]);
  };

  const add = trpc.playlists.addFeedVideo.useMutation({
    onSuccess: async (entry) => {
      await invalidate(entry.playlistId);
      toast.success("Video added to playlist");
    },
    onError: () => toast.error("Could not add video to playlist"),
  });
  const remove = trpc.playlists.removeFeedVideo.useMutation({
    onSuccess: async (entry) => {
      await invalidate(entry.playlistId);
      toast.success("Video removed from playlist");
    },
    onError: () => toast.error("Could not remove video from playlist"),
  });
  const create = trpc.playlists.create.useMutation({
    onSuccess: (playlist) => {
      setPlaylistName("");
      setIsCreating(false);
      add.mutate({
        playlistId: playlist.id,
        sourceId,
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
    },
    onError: () => toast.error("Could not create playlist"),
  });

  const submitNewPlaylist = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = playlistName.trim();
    if (name) create.mutate({ name });
  };

  return (
    <ResponsiveModal title="Add to playlist" open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" className="justify-start" onClick={() => setIsCreating((value) => !value)}>
          <PlusIcon className="mr-2 size-4" />
          Create playlist
        </Button>
        {isCreating && (
          <form className="flex gap-2" onSubmit={submitNewPlaylist}>
            <Input
              autoFocus
              aria-label="New playlist name"
              maxLength={100}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Playlist name"
              value={playlistName}
            />
            <Button type="submit" disabled={!playlistName.trim() || create.isPending || add.isPending}>
              Create and add
            </Button>
          </form>
        )}
        {playlists.isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!playlists.isLoading && (playlists.data?.pages.flatMap((page) => page.items) ?? []).map((playlist) => (
          <Button
            key={playlist.id}
            type="button"
            variant="ghost"
            className="w-full justify-start px-2 [&_svg]:size-5"
            size="lg"
            disabled={remove.isPending || add.isPending}
            onClick={() => {
              const videoData = {
                playlistId: playlist.id,
                sourceId,
                videoId: video.id,
              };
              if (playlist.containsVideo) remove.mutate(videoData);
              else add.mutate({
                ...videoData,
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
            }}
          >
            {playlist.containsVideo ? <SquareCheckIcon className="mr-2" /> : <SquareIcon className="mr-2" />}
            {playlist.name}
          </Button>
        ))}
        {!playlists.isLoading && (
          <InfiniteScroll
            hasNextPage={playlists.hasNextPage}
            isFetchingNextPage={playlists.isFetchingNextPage}
            fetchNextPage={playlists.fetchNextPage}
            isManual
          />
        )}
      </div>
    </ResponsiveModal>
  );
};