import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <HomeLayout>{children}</HomeLayout>;
}