import { StudioLayout } from "@/modules/studio/ui/layouts/studio-layouts";

interface LayoutProps {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <StudioLayout>
      {children}
    </StudioLayout>
  );
};

export default Layout;