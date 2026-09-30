import Image from "next/image"

import { formatDuration } from "@/lib/utils";

import { THUMBNAIL_FALLBACK } from "../../constants";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps {
  title: string;
  duration: number;
  imageUrl?: string | null;
  previewUrl?: string | null;
  playbackId?: string | null;
}

export const VideoThumbnailSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full" />
    </div>
  );
};

export const VideoThumbnail = ({
  title,
  imageUrl,
  previewUrl,
  duration,
  playbackId,
}: VideoThumbnailProps) => {
  const previewSource = previewUrl || (
    playbackId ? `https://image.mux.com/${playbackId}/animated.gif` : null
  );

  return (
    <div className="relative group/thumbnail">
      {/* Thumbnail wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image 
          src={imageUrl || THUMBNAIL_FALLBACK} 
          alt={title}
          fill 
          sizes="(max-width: 768px) 100vw, 384px"
          className="h-full w-full object-cover transition-opacity group-hover/thumbnail:opacity-0"
        />
        <Image
          unoptimized={!!previewSource}
          src={previewSource || THUMBNAIL_FALLBACK} 
          alt={title}
          fill 
          sizes="(max-width: 768px) 100vw, 384px"
          className="h-full w-full object-cover opacity-0 transition-opacity group-hover/thumbnail:opacity-100"
        />
      </div>

      {/* Video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}
      </div>
    </div>
  );
};
