"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

interface PlaylistAddModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistAddModal = ({
  videoId,
  open,
  onOpenChange,
}: PlaylistAddModalProps) => {
  return (
    <ResponsiveModal
      title="Add to playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div data-video-id={videoId}>
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          Playlist management is not available yet.
        </p>
      </div>
    </ResponsiveModal>
  );
};