import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { MenuItem } from "@/components/layout/sidebar/MenuItems";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar.tsx";

import { useAuthorize } from "@/hooks/useAuthorize.ts";

function CollapsibleMenuItem({
  item,
  depth,
}: {
  item: MenuItem;
  depth: number;
}) {
  const { isAllowed } = useAuthorize(item.requiredPermission);

  if (!isAllowed) {
    return null;
  }

  return item.children && item.children.length > 0 ? (
    <Collapsible className="group/collapsible">
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton>
            {item.icon && (
              <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>
            )}
            <span>{item.text}</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CollapsibleMenuItems items={item.children} depth={depth + 1} />
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  ) : (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link to={item.to ?? "#"}>
          {item.icon && (
            <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>
          )}
          {item.text}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export default function CollapsibleMenuItems({
  items,
  depth = 1,
}: {
  items: MenuItem[];
  depth?: number;
}) {
  return (
    <SidebarMenuSub>
      {items.map((item) => (
        <CollapsibleMenuItem key={item.text} item={item} depth={depth} />
      ))}
    </SidebarMenuSub>
  );
}
