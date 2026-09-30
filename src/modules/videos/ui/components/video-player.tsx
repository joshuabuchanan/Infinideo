"use client";

import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import { useState } from "react";

import { THUMBNAIL_FALLBACK } from "../../constants";

interface VideoPlayerProps {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  status?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
};

export const VideoPlayerSkeleton = () => {
  return <div className="aspect-video rounded-xl bg-background" />
};

export const VideoPlayer = ({
  playbackId,
  thumbnailUrl,
  status,
  autoPlay,
  onPlay,
}: VideoPlayerProps) => {
  const [failedPlayback, setFailedPlayback] = useState<{
    playbackId: VideoPlayerProps["playbackId"];
    status: VideoPlayerProps["status"];
  } | null>(null);
  const hasPlaybackError = failedPlayback !== null &&
    failedPlayback.playbackId === playbackId &&
    failedPlayback.status === status;

  if (!playbackId || (status && status !== "ready") || hasPlaybackError) {
    return (
      <div className="relative h-full w-full bg-background">
        <Image
          src={thumbnailUrl || THUMBNAIL_FALLBACK}
          alt="Video is being processed"
          fill
          className="object-contain opacity-80"
        />
      </div>
    );
  }

  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      poster={thumbnailUrl || THUMBNAIL_FALLBACK}
      playerInitTime={0}
      autoPlay={autoPlay}
      thumbnailTime={0}
      className="w-full h-full object-contain"
      accentColor="#FF2056"
      onPlay={onPlay}
      onError={() => setFailedPlayback({ playbackId, status })}
    />
  );
};