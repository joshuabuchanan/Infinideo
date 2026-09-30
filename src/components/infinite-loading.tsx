import { Loader2Icon } from "lucide-react";

export const InfiniteLoading = () => {
  return (
    <div className="flex items-center justify-center p-4" role="status" aria-label="Loading">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
};