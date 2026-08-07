import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    queryClient?: QueryClient;
  },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { ...options, wrapper: Wrapper }),
  };
}

type SessionContext = {
  session: {
    user: { id: number; email: string; roleId: number };
    permissions: Array<{ type: string; allowOthers?: boolean }>;
  };
};

/**
 * Minimal router for components that call Route.useRouteContext / useNavigate.
 * Pass `context` when the tree under test uses `_app` session context.
 */
export async function renderWithRouter(
  ui: ReactElement,
  options?: {
    queryClient?: QueryClient;
    initialEntries?: string[];
    context?: SessionContext;
  },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  const context = options?.context;

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => context ?? {},
    component: () => ui,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({
      initialEntries: options?.initialEntries ?? ["/"],
    }),
    context: {},
  });

  const result = render(<RouterProvider router={router} />);
  return { ...result, router, queryClient };
}
