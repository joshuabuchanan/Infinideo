import Link from "next/link";
import {
  ClapperboardIcon,
  CpuIcon,
  Gamepad2Icon,
  MonitorPlayIcon,
  Music2Icon,
  NewspaperIcon,
  RadioIcon,
  TrophyIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const trendingItems = [
  { title: "Music", url: "/explore/music", icon: Music2Icon },
  { title: "Gaming", url: "/explore/gaming", icon: Gamepad2Icon },
  { title: "News", url: "/explore/news", icon: NewspaperIcon },
  { title: "Sports", url: "/explore/sports", icon: TrophyIcon },
  { title: "Entertainment", url: "/explore/entertainment", icon: ClapperboardIcon },
  { title: "Technology", url: "/explore/technology", icon: CpuIcon },
  { title: "Live", url: "/explore/live", icon: RadioIcon },
  { title: "Videos", url: "/explore/videos", icon: MonitorPlayIcon },
];

export const TrendingSection = () => {
  return (
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Trending
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {trendingItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url} className="block">
                <SidebarMenuButton
                  tooltip={item.title}
                  className="h-10 rounded-xl text-sidebar-foreground! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground! [&_svg]:text-sidebar-foreground!"
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
  );
};