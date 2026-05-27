import { Sidebar } from "@/components/ui/sidebar"
import AppSidebarContent from "./AppSidebarContent"
import AppSidebarFooter from "./AppSidebarFooter"
import AppSidebarHeader from "./AppSidebarHeader"

export function AppSidebar() {
  return (<Sidebar collapsible="icon" className={"whitespace-nowrap overflow-hidden"}>
      <AppSidebarHeader/>
      <AppSidebarContent/>
      <AppSidebarFooter/>
    </Sidebar>)
}
