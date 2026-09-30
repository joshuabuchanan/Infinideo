"use client";

import { trpc } from "@/trpc/client";
import { UploadDropzone } from "~/lib/uploadthing";

import { ResponsiveModal } from "@/components/responsive-modal";

interface ThumbnailUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  onUploaded?: () => void;
}

export const ThumbnailUploadModal = ({
  open,
  onOpenChange,
  videoId,
  onUploaded,
}: ThumbnailUploadModalProps) => {
  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.studio.getMany.invalidate();
    utils.videos.getOne.invalidate({ id: videoId });
    onUploaded?.();
    onOpenChange(false);
  };

  return (
    <ResponsiveModal title="Upload a thumbnail" open={open} onOpenChange={onOpenChange}>
      <UploadDropzone
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
