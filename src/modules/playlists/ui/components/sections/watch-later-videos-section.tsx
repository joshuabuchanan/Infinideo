"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { BookmarkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export const WatchLaterVideosSection = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const query = trpc.feedVideoSaves.getMany.useQuery(undefined, {
    enabled: isLoaded && Boolean(isSignedIn),
  });

  if (!isLoaded || (isSignedIn && query.isLoading)) {
    return (
      <div className="h-32 animate-pulse rounded-lg border border-border/70 bg-card/60" />
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <p className="font-medium">Sign in to use Watch Later</p>
        <Button className="mt-4" onClick={() => clerk.openSignIn()}>
          Sign in
        </Button>
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load saved videos. Please try again.
      </p>
    );
  }

  const videos = query.data ?? [];

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 px-6 py-10 text-center">
        <BookmarkIcon className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 font-medium">No videos saved yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save a video while browsing and it will appear here.
        </p>
        <Button render={<Link href="/feed" />} nativeButton={false} className="mt-4">
          Browse videos
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/70">
      {videos.map((video) => (
        <Link
          key={`${video.sourceId}:${video.videoId}`}
          href={`/feed/${video.videoId.replace(":", "/")}`}
          className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4"
        >
          <Image
            src={video.thumbnail || "/placeholder-video.png"}
            alt=""
            width={400}
            height={225}
            unoptimized
            className="aspect-video w-full rounded-md bg-muted object-cover"
          />
          <div className="min-w-0 self-center">
            <h2 className="line-clamp-2 font-semibold text-foreground">{video.title}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{video.channelTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Number(video.viewCount).toLocaleString()} views
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};
