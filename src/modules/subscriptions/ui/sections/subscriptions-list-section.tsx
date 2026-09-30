"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

import { SubscriptionItem, SubscriptionItemSkeleton } from "../components/subscription-item";

export const SubscriptionsListSection = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const subscriptions = trpc.subscriptions.getMany.useInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      enabled: isLoaded && Boolean(isSignedIn),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const remove = trpc.subscriptions.remove.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.subscriptions.getMany.invalidate(),
        utils.videos.getManySubscribed.invalidate(),
      ]);
      toast.success("Unsubscribed");
    },
    onError: () => toast.error("Could not update subscriptions"),
  });

  if (!isLoaded || subscriptions.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, index) => <SubscriptionItemSkeleton key={index} />)}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="border-y border-border/70 py-8 text-center">
        <p className="font-medium">Sign in to manage subscriptions</p>
        <Button className="mt-3" onClick={() => clerk.openSignIn()}>Sign in</Button>
      </div>
    );
  }

  const items = subscriptions.data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="border-y border-border/70 py-8 text-center">
        <p className="font-medium">You are not following any creators yet</p>
        <Link className="mt-3 inline-flex text-sm font-medium text-primary hover:underline" href="/explore">
          Explore creators
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {items.map((subscription) => (
          <SubscriptionItem
            key={subscription.creatorId}
            userId={subscription.creatorId}
            name={subscription.creator.name}
            imageUrl={subscription.creator.imageUrl}
            subscriberCount={subscription.creator.subscriberCount}
            onUnsubscribe={() => remove.mutate({ userId: subscription.creatorId })}
            disabled={remove.isPending}
          />
        ))}
      </div>
      <InfiniteScroll
        hasNextPage={subscriptions.hasNextPage}
        isFetchingNextPage={subscriptions.isFetchingNextPage}
        fetchNextPage={subscriptions.fetchNextPage}
      />
    </>
  );
};