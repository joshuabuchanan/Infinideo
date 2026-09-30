"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { UserAvatar } from "@/components/user-avatar";
import { ListIcon } from "lucide-react";

export const LoadingSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuButton disabled>
            <Skeleton className="size-6 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      )) }
    </>
  );
};

export const SubscriptionsSection = () => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = trpc.subscriptions.getMany.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(isSignedIn),
    }
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading && <LoadingSkeleton />}
          {!isLoading && data?.pages.flatMap((page) => page.items).map((subscription) => (
            <SidebarMenuItem key={`${subscription.creatorId}-${subscription.viewerId}`}>
              <SidebarMenuButton
                tooltip={subscription.creator.name}
                render={<Link prefetch href={`/users/${subscription.creator.id}`} />}
                isActive={pathname === `/users/${subscription.creator.id}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    size="sm"
                    imageUrl={subscription.creator.imageUrl}
                    name={subscription.creator.name}
                  />
                  <span className="truncate text-sm">{subscription.creator.name}</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {!isLoading && hasNextPage && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
                <ListIcon className="size-4" />
                <span className="text-sm">{isFetchingNextPage ? "Loading..." : "Show more"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {!isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link prefetch href="/subscriptions" />}
                isActive={pathname === "/subscriptions"}
              >
                <ListIcon className="size-4" />
                <span className="text-sm">All subscriptions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
