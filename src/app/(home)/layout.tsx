"use client";

import { usePathname } from "next/navigation";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();

  if (pathname?.startsWith("/protected")) {
    return children;
  }

  return <HomeLayout clipsMode={pathname === "/clips"}>{children}</HomeLayout>;
};

export default Layout;