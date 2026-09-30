import Link from "next/link";

import { VideoInfo, VideoInfoSkeleton } from "./video-info";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";
import { VideoGetManyOutput } from "../../types";

interface VideoGridCardProps {
  data: VideoGetManyOutput["items"][number];
  onRemove?: () => void;
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-card p-3 text-card-foreground ring-1 ring-border/70">
      <VideoThumbnailSkeleton />
      <VideoInfoSkeleton />
    </div>
  );
};

export const VideoGridCard = ({
  data,
  onRemove,
}: VideoGridCardProps) => {
  return (
    <div className="group flex w-full flex-col gap-3 rounded-xl bg-card p-3 text-card-foreground ring-1 ring-border/70">
      <Link prefetch href={`/videos/${data.id}`}>
        <VideoThumbnail
          imageUrl={data.thumbnailUrl}
          previewUrl={data.previewUrl}
          playbackId={data.muxPlaybackId}
          title={data.title}
          duration={data.duration}
        />
      </Link>
      <VideoInfo data={data} onRemove={onRemove} />
    </div>
  );
};
