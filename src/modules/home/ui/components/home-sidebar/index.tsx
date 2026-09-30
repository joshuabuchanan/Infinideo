import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { MainSection } from "./main-section";
import PersonalSection from "./personal-section";
import { TrendingSection } from "./trending-section";
import { SubscriptionsSection } from "./subscriptions-section";

export const HomeSidebar = () => {
  return (
    <Sidebar
      className="top-35! z-40 h-[calc(100svh-8.75rem)]! border-none bg-background pt-2 sm:top-32! sm:h-[calc(100svh-8rem)]! lg:top-20! lg:h-[calc(100svh-5rem)]!"
      collapsible="icon"
    >
      <SidebarContent className="bg-background">
        <MainSection />
        <SidebarSeparator className="my-2" />
        <TrendingSection />
        <SidebarSeparator className="my-2" />
        <PersonalSection />
        <SidebarSeparator className="my-2" />
        <SubscriptionsSection />
      </SidebarContent>
    </Sidebar>
  );
};
