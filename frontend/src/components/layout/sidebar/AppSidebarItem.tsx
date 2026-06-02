import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import CollapsibleMenuItems from "@/components/layout/sidebar/CollapsibleMenuItems.tsx";
import type { MenuItem } from "@/components/layout/sidebar/MenuItems";
import PopoverMenuItems from "@/components/layout/sidebar/PopoverMenuItems.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar.tsx";
import { useAuthorize } from "@/hooks/useAuthorize.ts";

export default function AppSidebarItem({ item }: { item: MenuItem }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAllowed } = useAuthorize(item.requiredPermission);

  if (!isAllowed) {
    return null;
  }

  if (item.children && item.children.length > 0) {
    if (isCollapsed) {
      return (
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton tooltip={item.text}>
                {item.icon && (
                  <span className="h-4 w-4 shrink-0">{item.icon}</span>
                )}
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-48 p-1 rounded-md gap-1"
            >
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {item.text}
              </p>
              <PopoverMenuItems items={item.children} />
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.text}>
              {item.icon && (
                <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>
              )}
              <span>{item.text}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CollapsibleMenuItems items={item.children} />
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.text} asChild={!!item.to}>
        {item.to ? (
          <Link to={item.to}>
            {item.icon && (
              <span className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0">
                {item.icon}
              </span>
            )}
            <span className="group-data-[state=collapsed]:hidden">
              {item.text}
            </span>
          </Link>
        ) : (
          <>
            {item.icon && (
              <span className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0">
                {item.icon}
              </span>
            )}
            <span className="group-data-[state=collapsed]:hidden">
              {item.text}
            </span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
