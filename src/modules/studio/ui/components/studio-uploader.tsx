import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Images, UploadIcon } from "lucide-react";
import { UpChunk } from "@mux/upchunk";
import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from "@mux/mux-uploader-react";

import { Button } from "@/components/ui/button";

interface StudioUploaderProps {
  endpoint?: string | null;
  onSuccess: () => void;
};

const UPLOADER_ID = "video-uploader";

export const StudioUploader = ({
  endpoint,
  onSuccess,
}: StudioUploaderProps) => {
  const uploadRef = useRef<UpChunk | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => () => uploadRef.current?.abort(), []);

  const uploadSelectedVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !endpoint) return;

    if (!file.type.startsWith("video/")) {
      setUploadError("Choose a video file to upload.");
      return;
    }

    uploadRef.current?.abort();
    setUploadError("");
    setUploadProgress(0);

    try {
      const upload = UpChunk.createUpload({ endpoint, file });
      uploadRef.current = upload;
      upload.on("progress", (progressEvent) => {
        setUploadProgress(Math.round(Number(progressEvent.detail)));
      });
      upload.on("error", (uploadEvent) => {
        const detail = uploadEvent.detail as { message?: string } | string;
        const message = typeof detail === "string" ? detail : detail?.message;
        setUploadError(message || "The video could not be uploaded. Try again.");
        setUploadProgress(null);
        uploadRef.current = null;
      });
      upload.on("success", () => {
        setUploadProgress(100);
        uploadRef.current = null;
        onSuccess();
      });
    } catch {
      setUploadError("The video could not be uploaded. Try again.");
      setUploadProgress(null);
      uploadRef.current = null;
    }
  };

  return (
    <div>
      <MuxUploader
        onSuccess={onSuccess}
        endpoint={endpoint}
        id={UPLOADER_ID}
        className="hidden group/uploader"
      />
      <MuxUploaderDrop muxUploader={UPLOADER_ID} className="group/drop">
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted h-32 w-32">
            <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm">Drag and drop video files to upload</p>
            <p className="text-xs text-muted-foreground">
              Your videos will be private until you publish them
            </p>
          </div>
          <MuxUploaderFileSelect muxUploader={UPLOADER_ID}>
            <Button type="button" className="rounded-full">
              Select files
            </Button>
          </MuxUploaderFileSelect>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <input
              className="peer sr-only"
              id="studio-camera-video"
              type="file"
              accept="video/*"
              capture="environment"
              onChange={uploadSelectedVideo}
              disabled={uploadProgress !== null}
            />
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/15 peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-2${uploadProgress !== null ? " pointer-events-none opacity-50" : ""}`}
              htmlFor="studio-camera-video"
              aria-disabled={uploadProgress !== null}
            >
              <Camera aria-hidden="true" />
              <span>Record video</span>
            </label>
            <input
              className="peer sr-only"
              id="studio-gallery-video"
              type="file"
              accept="video/*"
              onChange={uploadSelectedVideo}
              disabled={uploadProgress !== null}
            />
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/15 peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-2${uploadProgress !== null ? " pointer-events-none opacity-50" : ""}`}
              htmlFor="studio-gallery-video"
              aria-disabled={uploadProgress !== null}
            >
              <Images aria-hidden="true" />
              <span>Choose from gallery</span>
            </label>
          </div>
          {uploadProgress !== null && (
            <div className="mt-3 grid w-full max-w-xs gap-1.5 text-left text-xs text-muted-foreground" role="status" aria-live="polite">
              <span>Uploading video: {uploadProgress}%</span>
              <progress className="h-2 w-full accent-primary" value={uploadProgress} max={100} aria-label="Video upload progress" />
            </div>
          )}
          {uploadError && <p className="text-sm text-destructive" role="alert">{uploadError}</p>}
        </div>
        <span slot="separator" className="hidden" />
        <MuxUploaderStatus
          muxUploader={UPLOADER_ID}
          className="text-sm"
        />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          className="text-sm"
          type="percentage"
        />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          type="bar"
        />
      </MuxUploaderDrop>
    </div>
  );
};
