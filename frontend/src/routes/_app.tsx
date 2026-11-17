import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Header from "@/components/layout/header/Header";
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { accountIndexSelection, readPinnedAccountIndex } from "@/lib/authuser";
import { loadSession } from "@/lib/self";
import type { RootSearch } from "@/routes/__root";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const session = await loadSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
    const pinned = readPinnedAccountIndex();
    if (
      accountIndexSelection(location.searchStr).kind === "absent" &&
      pinned !== undefined
    ) {
      throw redirect({
        search: (prev: RootSearch) => ({ ...prev, authuser: pinned }),
        replace: true,
      });
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
