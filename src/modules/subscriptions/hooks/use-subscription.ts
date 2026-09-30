"use client";

import { useClerk } from "@clerk/nextjs";

import { trpc } from "@/trpc/client";

interface UseSubscriptionProps {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  userId,
  isSubscribed,
  fromVideoId,
}: UseSubscriptionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const mutation = trpc.subscriptions[isSubscribed ? "remove" : "create"].useMutation({
    onSuccess: () => {
      if (fromVideoId) {
        void utils.videos.getOne.invalidate({ id: fromVideoId });
      }
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  return {
    isPending: mutation.isPending,
    onClick: () => mutation.mutate({ userId }),
  };
};