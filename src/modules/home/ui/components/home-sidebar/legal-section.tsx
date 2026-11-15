import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const legalItems = [
  { title: "Privacy Policy", label: "Privacy", url: "/privacy", icon: ShieldCheck },
  { title: "Terms of Service", label: "Terms", url: "/terms", icon: FileText },
];

export const LegalSection = () => (
  <SidebarGroup className="px-2 py-2">
    <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      Legal
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {legalItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link href={item.url} className="block">
              <SidebarMenuButton
                tooltip={item.title}
                aria-label={item.title}
                className="h-10 rounded-xl text-sidebar-foreground! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground! [&_svg]:text-sidebar-foreground!"
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-base font-medium group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);