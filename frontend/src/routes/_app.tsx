import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Header from "@/components/layout/header/Header";
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { loadSession } from "@/lib/self";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await loadSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
    return { session };
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="@container flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
