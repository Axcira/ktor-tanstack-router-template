import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TooltipProvider } from "@/components/ui/tooltip"
import "../styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useThemeEffect } from "@/hooks/useThemeEffect.ts"

export const Route = createRootRoute({
    component: RootComponent,
})

const queryClient = new QueryClient()

function RootComponent() {
  useThemeEffect()
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <main className="min-h-screen bg-background">
                        <Outlet />
                    </main>
                </TooltipProvider>
            </QueryClientProvider>

            <TanStackDevtools
                config={{ position: "bottom-right" }}
                plugins={[{
                    name: "TanStack Router", render: <TanStackRouterDevtoolsPanel />,
                }]}
            />
        </>
    )
}