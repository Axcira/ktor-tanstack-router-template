import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeEffect } from "@/hooks/useThemeEffect.ts";
import "../styles.css";

export const Route = createRootRoute({
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
          <Toaster richColors position="bottom-right" />
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
