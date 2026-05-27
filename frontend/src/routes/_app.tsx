
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "#/components/layout/sidebar/AppSidebar.tsx"
import { SidebarProvider } from "@/components/ui/sidebar"
import Header from "#/components/layout/header/Header.tsx"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
  )
}