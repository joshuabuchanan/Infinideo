import { AlertTriangleIcon } from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { VideoGetOneOutput } from "../../types";

interface VideoBannerProps {
  status: VideoGetOneOutput["muxStatus"];
  onRevalidate?: () => void;
  isRevalidating?: boolean;
};

export const VideoBanner = ({ status, onRevalidate, isRevalidating }: VideoBannerProps) => {
  if (status === "ready") return null;

  return (
    <div className="bg-yellow-500 py-3 px-4 rounded-b-xl flex items-center gap-3">
      <AlertTriangleIcon className="size-4 text-foreground shrink-0" />
      <p className="text-xs md:text-sm font-medium text-foreground line-clamp-1 flex-1">
        This video is still being processed.
      </p>
      {onRevalidate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground"
          onClick={onRevalidate}
          disabled={isRevalidating}
        >
          {isRevalidating ? "Checking..." : "Check status"}
        </Button>
      )}
    </div>
  );
};
