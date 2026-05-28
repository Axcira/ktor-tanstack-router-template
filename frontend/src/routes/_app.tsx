import {
    createFileRoute,
    Outlet,
    redirect,
} from "@tanstack/react-router"
import Header from "@/components/layout/header/Header.tsx"
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar.tsx"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getSelf } from "@/api/generated/default/default.ts";

export const Route = createFileRoute("/_app")({
    beforeLoad: async () => {
        let response

        try {
            response = await getSelf()
        } catch {
            throw redirect({
                to: "/hero",
            })
        }

        if (response.status !== 200) {
            throw redirect({
                to: "/hero",
            })
        }

        return { user: response.data }
    },
    component: AppLayout,
})

function AppLayout() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <Header/>
                <main className="flex-1 overflow-y-auto">
                    <Outlet/>
                </main>
            </div>
        </SidebarProvider>
    )
}
