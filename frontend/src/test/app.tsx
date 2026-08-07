import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { resetAppQueryClient } from "./handlers";

export async function renderApp(initialEntry: string) {
  resetAppQueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  const result = render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(router.state.status).toBe("idle");
  });

  return {
    router,
    ...result,
  };
}
