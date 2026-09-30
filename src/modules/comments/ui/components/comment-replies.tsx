import { CornerDownRightIcon } from "lucide-react";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { InfiniteLoading } from "@/components/infinite-loading";

import { CommentItem } from "./comment-item";

interface CommentRepliesProps {
  parentId: string;
  videoId: string;
}

export const CommentReplies = ({
  parentId,
  videoId,
}: CommentRepliesProps) => {
  const { 
    data, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.comments.getMany.useInfiniteQuery({
    limit: DEFAULT_LIMIT,
    videoId,
    parentId,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <div className="pl-14">
      <div className="flex flex-col gap-4 mt-2">
        {isLoading && <InfiniteLoading />}
        {!isLoading && 
          data?.pages
            .flatMap((page) => page.items)
            .map((comment) => (
              <CommentItem key={comment.id} comment={comment} variant="reply" />
            ))
        }
      </div>
      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          <CornerDownRightIcon />
          Show more replies
        </Button>
      )}
    </div>
  );
};
