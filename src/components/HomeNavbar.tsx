import { HomeNavbar as HomeNavbarBase } from "@/modules/home/ui/components/home-navbar";

const HomeNavbar = HomeNavbarBase as typeof HomeNavbarBase & {
  displayName?: string;
  defaultProps?: {
    className?: string;
  };
};

HomeNavbar.displayName = "HomeNavbar";

HomeNavbar.defaultProps = {
  className: "bg-white text-black dark:bg-white dark:text-black",
};

export { HomeNavbar } from "@/modules/home/ui/components/home-navbar";
