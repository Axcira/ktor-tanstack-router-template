import AppSidebarItem from "@/components/layout/sidebar/ AppSidebarItem.tsx";

import menuItems from "@/components/layout/sidebar/MenuItems";
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
} from "@/components/ui/sidebar.tsx";


export default function AppSidebarContent() {
  return (<SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {menuItems.map((item) => (<AppSidebarItem key={item.text} item={item}/>))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>)
}
