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
import { ChevronRight, SquareTerminal, Bot, BookOpen, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function AppSidebarContent() {
    return(
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu>

                    {/* 開閉するメニュー（Playground） */}
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Playground">
                                    <SquareTerminal className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0" />
                                    <span className="group-data-[state=collapsed]:hidden">Playground</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[state=collapsed]:hidden" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <Link to="/playground/nav1-1">Nav 1-1</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <Link to="/playground/nav1-2">Nav 1-2</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <Link to="/playground/nav1-3">Nav 1-3</Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    {/* 開閉しない通常のメニュー */}
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Models" asChild>
                            <Link to="/models">
                                <Bot className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0" />
                                <span className="group-data-[state=collapsed]:hidden">Models</span>
                                <ChevronRight className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Documentation" asChild>
                            <Link to="/documentation">
                                <BookOpen className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0" />
                                <span className="group-data-[state=collapsed]:hidden">Documentation</span>
                                <ChevronRight className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings" asChild>
                            <Link to="/settings">
                                <Settings2 className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0" />
                                <span className="group-data-[state=collapsed]:hidden">Settings</span>
                                <ChevronRight className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    )
}