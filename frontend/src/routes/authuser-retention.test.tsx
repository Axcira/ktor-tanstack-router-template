import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
  retainSearchParams,
  useNavigate,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { parseAuthUser } from "@/lib/authuser";

function createAuthUserRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    validateSearch: (search: Record<string, unknown>) => {
      const authuser = parseAuthUser(search.authuser);
      return authuser === undefined ? {} : { authuser };
    },
    search: {
      middlewares: [retainSearchParams(["authuser"])],
    },
    component: function Root() {
      const navigate = useNavigate();
      return (
        <>
          <Link to="/articles">記事</Link>
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/articles",
                search: (prev) => ({ ...prev, page: 2 }),
              })
            }
          >
            2ページ目
          </button>
          <Outlet />
        </>
      );
    },
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>Home</div>,
  });
  const articlesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/articles",
    validateSearch: (search: { page?: unknown }) => ({
      page: Number(search.page ?? 1),
    }),
    component: () => <div>Articles</div>,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([homeRoute, articlesRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
}

describe("authuser retention", () => {
  it("keeps authuser when a link does not mention it", async () => {
    const router = createAuthUserRouter("/?authuser=2");
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("link", { name: "記事" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/articles");
      expect(router.state.location.search).toMatchObject({
        authuser: 2,
        page: 1,
      });
    });
  });

  it("keeps authuser when navigation updates another search param", async () => {
    const router = createAuthUserRouter("/articles?authuser=0&page=1");
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "2ページ目" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        authuser: 0,
        page: 2,
      });
    });
  });
});
