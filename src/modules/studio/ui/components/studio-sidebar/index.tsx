import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { MainSection } from "./main-section";
import PersonalSection from "./personal-section";
import { TrendingSection } from "./trending-section";
import { StudioSidebarHeader } from "./studio-sidebar-header";

export const StudioSidebar = () => {
  return (
    <Sidebar
      className="top-20! z-40 h-[calc(100svh-5rem)]! border-none bg-background pt-2"
      collapsible="icon"
    >
      <StudioSidebarHeader />
      <SidebarContent className="bg-background">
        <MainSection />
        <SidebarSeparator className="my-2" />
        <TrendingSection />
        <SidebarSeparator className="my-2" />
        <PersonalSection />
      </SidebarContent>
    </Sidebar>
  );
};
