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
                                    <SquareTerminal className="mr-2 h-4 w-4" />
                                    <span>Sidebar Nav 1</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <a href="#">Nav 1-1</a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <a href="#">Nav 1-2</a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <a href="#">Nav 1-2</a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    {/* 開閉しない通常のメニュー */}
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Models">
                            <Bot className="mr-2 h-4 w-4" />
                            <span>Sidebar Nav 2</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Documentation">
                            <BookOpen className="mr-2 h-4 w-4" />
                            <span>Sidebar Nav 3</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings">
                            <Settings2 className="mr-2 h-4 w-4" />
                            <span>Sidebar Nav 4</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    )
}