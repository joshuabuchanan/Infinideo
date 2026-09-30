"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteLoading } from "@/components/infinite-loading";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comment-item";

interface CommentsSectionProps {
  videoId: string;
};

export const CommentsSection = ({ videoId }: CommentsSectionProps) => {
  return (
    <Suspense fallback={<CommentsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const CommentsSectionSkeleton = () => {
  return (
    <div className="mt-6">
      <InfiniteLoading />
    </div>
  );
}

const CommentsSectionSuspense = ({ videoId }: CommentsSectionProps) => {
  const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery({ 
    videoId,
    limit: DEFAULT_LIMIT
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">
          {comments.pages[0].totalCount} Comments
        </h2>
        <CommentForm videoId={videoId} />
        <div className="flex flex-col  gap-4 mt-2">
          {comments.pages.flatMap((page) => page.items).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Be the first to comment.
            </p>
          ) : (
            comments.pages.flatMap((page) => page.items).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
          <InfiniteScroll
            isManual
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
};
