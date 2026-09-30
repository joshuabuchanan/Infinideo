import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";

import { SubscriptionButton } from "./subscription-button";

interface SubscriptionItemProps {
  userId: string;
  name: string;
  imageUrl: string;
  subscriberCount: number;
  onUnsubscribe: () => void;
  disabled: boolean;
};

export const SubscriptionItemSkeleton = () => {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="size-10 rounded-full" />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>

          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

export const SubscriptionItem = ({
  userId,
  name,
  imageUrl,
  subscriberCount,
  onUnsubscribe,
  disabled,
}: SubscriptionItemProps) => {
  return (
    <div className="flex items-start gap-4">
      <UserAvatar
        size="lg"
        imageUrl={imageUrl}
        name={name}
      />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <Link href={`/users/${userId}`} className="min-w-0 hover:underline">
            <h3 className="truncate text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground">
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </Link>

          <SubscriptionButton
            size="sm"
            onClick={onUnsubscribe}
            disabled={disabled}
            isSubscribed
          />
        </div>
      </div>
    </div>
  );
};
