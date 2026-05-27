import { Sidebar } from "@/components/ui/sidebar"
import AppSidebarHeader from "./AppSidebarHeader"
import AppSidebarContent from "./AppSidebarContent"
import AppSidebarFooter from "./AppSidebarFooter"

export function AppSidebar() {
  return (
      <Sidebar collapsible="icon" className={"whitespace-nowrap overflow-hidden"}>
          <AppSidebarHeader/>
          <AppSidebarContent/>
          <AppSidebarFooter/>
      </Sidebar>
  )
}
