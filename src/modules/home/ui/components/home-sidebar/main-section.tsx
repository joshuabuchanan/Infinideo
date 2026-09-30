"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  ClapperboardIcon,
  CompassIcon,
  HomeIcon,
  PlaySquareIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
    active: true,
  },
  {
    title: "Explore",
    url: "/explore",
    icon: CompassIcon,
  },
  {
    title: "Clips",
    url: "/clips",
    icon: ClapperboardIcon,
  },
  {
    title: "Subscriptions",
    url: "/subscriptions",
    icon: PlaySquareIcon,
    auth: true,
  },
];

export const MainSection = () => {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  const renderItem = (item: (typeof items)[number], isPrimary = false) => {
    const commonClasses =
      isPrimary
        ? "flex h-12 w-full items-center justify-start gap-3 rounded-xl border border-white/15 bg-violet-500/15 px-3 text-left text-sidebar-foreground shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)] transition-colors hover:bg-violet-500/20 dark:text-white [&_svg]:text-sidebar-foreground dark:[&_svg]:text-white group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0! group-data-[collapsible=icon]:p-0!"
        : "flex h-12 w-full items-center justify-start gap-3 rounded-xl px-3 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0! group-data-[collapsible=icon]:p-0!";

    return (
      <SidebarMenuItem key={item.title}>
        <Link href={item.url} className="block">
          <button
            type="button"
            className={commonClasses}
            onClick={(e) => {
              if (!isSignedIn && item.auth) {
                e.preventDefault();
                return clerk.openSignIn();
              }
            }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="text-base font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden">
              {item.title}
            </span>
          </button>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarGroup className="space-y-1 px-2 py-2">
      <SidebarGroupContent>
        <SidebarMenu>
          {renderItem(items[0], true)}
          {items.slice(1).map((item) => renderItem(item))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};