import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import CollapsibleMenuItems from "@/components/layout/sidebar/CollapsibleMenuItems";
import type { MenuItem } from "@/components/layout/sidebar/MenuItems";
import PopoverMenuItems from "@/components/layout/sidebar/PopoverMenuItems";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthorize } from "@/hooks/useAuthorize";

export default function AppSidebarItem({ item }: { item: MenuItem }) {
  const { isMobile, state } = useSidebar();
  // Desktop icon-collapse is a separate preference. The mobile sheet is always
  // the full menu, so a collapsed desktop state must not drop labels there.
  const isCollapsed = state === "collapsed" && !isMobile;
  const { isAllowed } = useAuthorize(item.requiredPermission);

  if (!isAllowed) {
    return null;
  }

  if (item.children && item.children.length > 0) {
    if (isCollapsed) {
      return (
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger
              render={
                <SidebarMenuButton tooltip={item.text}>
                  {item.icon && (
                    <span className="h-4 w-4 shrink-0">{item.icon}</span>
                  )}
                </SidebarMenuButton>
              }
            />
            <PopoverContent
              side="right"
              align="start"
              className="w-48 p-1 rounded-lg gap-1"
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
          <CollapsibleTrigger
            render={
              <SidebarMenuButton tooltip={item.text}>
                {item.icon && (
                  <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>
                )}
                <span>{item.text}</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-open/collapsible:rotate-90" />
              </SidebarMenuButton>
            }
          />
          <CollapsibleContent>
            <CollapsibleMenuItems items={item.children} />
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.text}
        render={item.to ? <Link to={item.to} /> : undefined}
      >
        {item.icon && (
          <span className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0">
            {item.icon}
          </span>
        )}
        <span className="group-data-[state=collapsed]:hidden">{item.text}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
