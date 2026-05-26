// src/routes/_app.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import Header from "@/components/layout/header"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col w-full overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Outlet /> {/* この中に /photos などの中身が入る */}
          </main>
        </div>
      </SidebarProvider>
  )
}