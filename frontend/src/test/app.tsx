import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { resetAppQueryClient, usableAccountsHandler } from "./handlers";
import { server } from "./msw";

export async function renderApp(initialEntry: string) {
  resetAppQueryClient();
  server.use(usableAccountsHandler());
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  const result = render(<RouterProvider router={router} />);

  await waitFor(
    () => {
      expect(router.state.status).toBe("idle");
    },
    { timeout: 5000 },
  );

  return {
    router,
    ...result,
  };
}
