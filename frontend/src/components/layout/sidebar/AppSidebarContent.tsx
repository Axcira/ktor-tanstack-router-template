import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem } from "@/components/ui/sidebar.tsx";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible.tsx";
import { ChevronRight, Bot, BookOpen, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
        icon: <Bot />,
        children: [
            { text: "Some Item 1",  to: "/playground/nav1-1" },
            { text: "Some Item 2" , to: "/playground/nav1-2" }
        ]
    },
    { text: "Settings", to: "/settings", icon: <Settings2 /> },
    { text: "Documentation", to: "/documentation", icon: <BookOpen /> },
]

function AppSidebarItem({ item }: { item: MenuItem }) {
    if (item.children && item.children.length > 0) {
        return (
            <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.text}>
                            {item.icon && (
                                <span className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            <span className="group-data-[state=collapsed]:hidden">{item.text}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[state=collapsed]:hidden" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.text}>
                                    <SidebarMenuSubButton asChild>
                                        <Link to={child.to ?? "#"}>
                                            {child.icon && (
                                                <span className="h-4 w-4 mr-2 shrink-0">
                                                    {child.icon}
                                                </span>
                                            )}
                                            {child.text}
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
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
                        <ChevronRight className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
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
                        <AppSidebarItem key={item.text} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    )
}