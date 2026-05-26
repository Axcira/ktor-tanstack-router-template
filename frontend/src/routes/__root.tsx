import { TanStackDevtools } from "@tanstack/react-devtools"
import {
  createRootRoute,
  Outlet,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { AppSidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import Header from "@/components/layout/header"

import { TooltipProvider } from "@/components/ui/tooltip"
import "../styles.css"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

export const Route = createRootRoute({
  component: RootComponent,
})

const queryClient = new QueryClient()

function RootComponent() {
  return (
      <>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SidebarProvider>
              {/* サイドバー*/}
              <AppSidebar />
              <div className="flex flex-1 flex-col w-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                  <Outlet />
                </main>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </QueryClientProvider>

        <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[{
              name: "TanStack Router", render: <TanStackRouterDevtoolsPanel/>,
            }]}
        />
      </>
  )
}