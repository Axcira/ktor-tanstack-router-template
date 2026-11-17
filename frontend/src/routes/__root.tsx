import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeEffect } from "@/hooks/useThemeEffect";
import { parseAuthUser } from "@/lib/authuser";
import "../styles.css";

export type RootSearch = {
  authuser?: number;
};

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>): RootSearch => {
    const authuser = parseAuthUser(search.authuser);
    return authuser === undefined ? {} : { authuser };
  },
  search: {
    middlewares: [retainSearchParams(["authuser"])],
  },
  component: RootComponent,
});

export const queryClient = new QueryClient();

function RootComponent() {
  useThemeEffect();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <main className="min-h-screen bg-background">
            <Outlet />
          </main>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>

      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
