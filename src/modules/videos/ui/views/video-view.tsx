import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient, trpc } from "@/trpc/server";

import { VideoSection } from "../sections/video-section";
import { CommentsSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggestions-section";

interface VideoViewProps {
  videoId: string;
}

export const VideoView = async ({ videoId }: VideoViewProps) => {
  void trpc.comments.getMany.prefetchInfinite({
    videoId,
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <div className="flex flex-col max-w-[1700px] mx-auto pt-2.5 px-4 mb-10">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <VideoSection videoId={videoId} />
            <div className="xl:hidden block mt-4">
              <SuggestionsSection videoId={videoId} isManual />
            </div>
            <CommentsSection videoId={videoId} />
          </div>
          <div className="hidden w-full shrink xl:block xl:w-95 2xl:w-115">
            <SuggestionsSection videoId={videoId} />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
};
