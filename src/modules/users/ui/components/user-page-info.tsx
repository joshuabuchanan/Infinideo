"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";

import { UserGetOneOutput } from "../types";
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";

interface UserPageInfoProps {
  user: UserGetOneOutput;
}

export const UserPageInfoSkeleton = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-15 w-15 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
        </div>
        <Skeleton className="mt-3 h-10 w-full rounded-full" />
      </div>

      <div className="hidden items-start gap-4 md:flex">
        <Skeleton className="h-40 w-40 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-5 w-48" />
          <Skeleton className="mt-3 h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const UserPageInfo = ({ user }: UserPageInfoProps) => {
  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();
  const isOwner = user.clerkId === userId;
  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed: user.viewerSubscribed,
  });

  const handleAvatarClick = () => clerk.openUserProfile();

  const ownerAction = (className: string) => (
    <Link
      prefetch
      href="/studio"
      className={buttonVariants({
        variant: "secondary",
        className: cn("rounded-full", className),
      })}
    >
      Go to studio
    </Link>
  );

  const subscriptionAction = (className: string) => (
    <SubscriptionButton
      disabled={isPending || !isLoaded}
      isSubscribed={user.viewerSubscribed}
      onClick={onClick}
      className={className}
    />
  );

  return (
    <div className="py-6">
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          {isOwner ? (
            <button
              type="button"
              aria-label="Edit profile"
              onClick={handleAvatarClick}
              className="shrink-0 rounded-full transition-opacity duration-300 hover:opacity-80"
            >
              <UserAvatar
                size="lg"
                imageUrl={user.imageUrl}
                name={user.name}
                className="h-15 w-15"
              />
            </button>
          ) : (
            <UserAvatar
              size="lg"
              imageUrl={user.imageUrl}
              name={user.name}
              className="h-15 w-15"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span>{user.subscriberCount} subscribers</span>
              <span>&bull;</span>
              <span>{user.videoCount} videos</span>
            </div>
          </div>
        </div>
        {isOwner ? (
          ownerAction("mt-3 w-full")
        ) : (
          subscriptionAction("mt-3 w-full")
        )}
      </div>

      <div className="hidden items-start gap-4 md:flex">
        {isOwner ? (
          <button
            type="button"
            aria-label="Edit profile"
            onClick={handleAvatarClick}
            className="shrink-0 rounded-full transition-opacity duration-300 hover:opacity-80"
          >
            <UserAvatar
              size="lg"
              imageUrl={user.imageUrl}
              name={user.name}
              className="h-40 w-40"
            />
          </button>
        ) : (
          <UserAvatar
            size="lg"
            imageUrl={user.imageUrl}
            name={user.name}
            className="h-40 w-40"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-bold">{user.name}</h1>
          <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
            <span>{user.subscriberCount} subscribers</span>
            <span>&bull;</span>
            <span>{user.videoCount} videos</span>
          </div>
          {isOwner ? (
            ownerAction("mt-3")
          ) : (
            subscriptionAction("mt-3")
          )}
        </div>
      </div>
    </div>
  );
};
