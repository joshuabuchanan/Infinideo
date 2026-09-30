"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { HomeNavbar } from "@/components/HomeNavbar";
import { HomeSidebar } from "../components/home-sidebar";

interface HomeLayoutProps {
  children: React.ReactNode;
  clipsMode?: boolean;
}

export const HomeLayout = ({ children, clipsMode = false }: HomeLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="w-full">
        {!clipsMode && <HomeNavbar />}
        <div className={`flex min-h-screen ${clipsMode ? "clips-mode-layout" : "pt-35 sm:pt-32 lg:pt-20"}`}>
          {!clipsMode && <HomeSidebar />}
          <main className={`flex-1 overflow-y-auto bg-background${clipsMode ? " clips-mode-main" : ""}`}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};