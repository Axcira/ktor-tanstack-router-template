import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
} from "@/components/ui/sidebar.tsx";

import menuItems from "@/components/layout/sidebar/MenuItems";

import AppSidebarItem from "#/components/layout/sidebar/ AppSidebarItem.tsx";


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