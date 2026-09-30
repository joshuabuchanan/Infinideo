"use client";

import Link from "next/link";

import { useAuth, useClerk } from "@clerk/nextjs";

import {
  Clock3Icon,
  HistoryIcon,
  LibraryBigIcon,
  ThumbsUpIcon,
  VideoIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Library",
    url: "/library",
    icon: LibraryBigIcon,
    auth: true,
  },
  {
    title: "History",
    url: "/history",
    icon: HistoryIcon,
    auth: true,
  },
  {
    title: "Your Videos",
    url: "/your-videos",
    icon: VideoIcon,
    auth: true,
  },
  {
    title: "Watch Later",
    url: "/watch-later",
    icon: Clock3Icon,
    auth: true,
  },
  {
    title: "Liked Videos",
    url: "/liked-videos",
    icon: ThumbsUpIcon,
    auth: true,
  },
];

export const PersonalSection = () => {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  return (
    <>
      <SidebarGroup className="px-2 py-2">
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="block">
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="h-12 rounded-xl text-sidebar-foreground! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground! [&_svg]:text-sidebar-foreground!"
                    onClick={(e) => {
                      if (!isSignedIn && item.auth) {
                        e.preventDefault();
                        return clerk.openSignIn();
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base font-medium group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

    </>
  );
};

export default PersonalSection;