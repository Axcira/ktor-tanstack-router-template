import { queryOptions } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { getSelf } from "@/api/generated/default/default.ts";
import Header from "@/components/layout/header/Header.tsx"
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar.tsx"
import { SidebarProvider } from "@/components/ui/sidebar"
import { queryClient } from "@/routes/__root.tsx";

const selfQueryOptions = queryOptions({
  queryKey: ["self"], queryFn: async () => {
    const self = await getSelf()
    if (self.status === 200) return self.data
    throw new Error("Failed to fetch self data")
  }, staleTime: 1000 * 60,
})

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    try {
      const session = await queryClient.ensureQueryData(selfQueryOptions)
      return {session}
    } catch {
      throw redirect({
        to: "/hero",
      })
    }
  }, component: AppLayout,
})

function AppLayout() {
  return (<SidebarProvider>
    <AppSidebar/>
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <Header/>
      <main className="flex-1 overflow-y-auto">
        <Outlet/>
      </main>
    </div>
  </SidebarProvider>)
}
