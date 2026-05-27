import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar.tsx";

import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {ChevronRight, Bot, BookOpen, Settings2} from "lucide-react";
import {Link} from "@tanstack/react-router";
import * as React from "react";

interface MenuItem {
    text: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    to?: string;
}

const menuItems: MenuItem[] = [
    {
        text: "Models",
        icon: <Bot/>,
        children: [
            {
                text: "Some Item 1",
                to: "/playground/nav1-1",
                children: [
                    {text: "Sub Item 1-1", to: "/playground/nav1-1-1"},
                    {text: "Sub Item 1-2", to: "/playground/nav1-1-2"},
                ],
            },
            {text: "Some Item 2", to: "/playground/nav1-2"},
        ],
    },
    {text: "Settings", to: "/settings", icon: <Settings2/>},
    {text: "Documentation", to: "/documentation", icon: <BookOpen/>},
]

// ---- Popoverメニュー（collapsed時・再帰対応） ----
function PopoverMenuItems({items}: { items: MenuItem[] }) {
    return (
        <>
            {items.map((item) =>
                item.children && item.children.length > 0 ? (
                    // 子あり → 右にもう一個Popover
                    <Popover key={item.text}>
                        <PopoverTrigger asChild>
                            <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
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
                    </Popover>
                ) : (
                    // 子なし → Link
                    <SidebarMenuSubButton key={item.text} asChild>
                        <Link
                            to={item.to ?? "#"}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                        >
                            {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                            {item.text}
                        </Link>
                    </SidebarMenuSubButton>
                )
            )}
        </>
    )
}

// ---- Collapsibleメニュー（expanded時・再帰対応） ----
function CollapsibleMenuItems({items, depth = 1}: { items: MenuItem[]; depth?: number }) {
    return (
        <SidebarMenuSub>
            {items.map((item) =>
                item.children && item.children.length > 0 ? (
                    <Collapsible key={item.text} className="group/collapsible">
                        <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton>
                                    {item.icon && <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>}
                                    <span>{item.text}</span>
                                    <ChevronRight
                                        className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90"/>
                                </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent >
                                <CollapsibleMenuItems items={item.children} depth={depth + 1}/>
                            </CollapsibleContent>
                        </SidebarMenuSubItem>
                    </Collapsible>
                ) : (
                    <SidebarMenuSubItem key={item.text}>
                        <SidebarMenuSubButton asChild>
                            <Link to={item.to ?? "#"}>
                                {item.icon && <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>}
                                {item.text}
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                )
            )}
        </SidebarMenuSub>
    )
}

// ---- トップレベルのアイテム ----
function AppSidebarItem({item}: { item: MenuItem }) {
    const {state} = useSidebar()
    const isCollapsed = state === "collapsed"

    if (item.children && item.children.length > 0) {
        if (isCollapsed) {
            return (
                <SidebarMenuItem>
                    <Popover>
                        <PopoverTrigger asChild>
                            <SidebarMenuButton tooltip={item.text}>
                                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                            </SidebarMenuButton>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-48 p-1 rounded-md　gap-1">
                            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {item.text}
                            </p>
                            <PopoverMenuItems items={item.children}/>
                        </PopoverContent>
                    </Popover>
                </SidebarMenuItem>
            )
        }

        return (
            <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.text}>
                            {item.icon && <span className="h-4 w-4 mr-2 shrink-0">{item.icon}</span>}
                            <span>{item.text}</span>
                            <ChevronRight
                                className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90"/>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CollapsibleMenuItems items={item.children}/>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        )
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
                        <span className="group-data-[state=collapsed]:hidden">{item.text}</span>
                    </Link>
                ) : (
                    <>
                        {item.icon && (
                            <span className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0">
                                {item.icon}
                            </span>
                        )}
                        <span className="group-data-[state=collapsed]:hidden">{item.text}</span>
                    </>
                )}
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export default function AppSidebarContent() {
    return (
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <AppSidebarItem key={item.text} item={item}/>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    )
}