import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { MenuItem } from "#/components/layout/sidebar/MenuItems";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { SidebarMenuSubButton } from "@/components/ui/sidebar.tsx";

export default function PopoverMenuItems({items}: { items: MenuItem[] }) {
  return (<>
    {items.map((item) => item.children && item.children.length > 0 ? (<Popover key={item.text}>
      <PopoverTrigger asChild>
        <button
          type={"button"}
          className="flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm hover:bg-accent">
          {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
          <span className="flex-1 text-left">{item.text}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/>
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-48 p-1 rounded-md gap-1">
        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {item.text}
        </p>
        <PopoverMenuItems items={item.children}/>
      </PopoverContent>
    </Popover>) : (<SidebarMenuSubButton key={item.text} asChild>
      <Link
        to={item.to ?? "#"}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
      >
        {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
        {item.text}
      </Link>
    </SidebarMenuSubButton>))}
  </>)
}
