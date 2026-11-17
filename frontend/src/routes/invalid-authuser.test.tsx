import {
  createBrowserHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { resetAppQueryClient } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("invalid authuser", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("removes an illegal authuser before the page renders", async () => {
    window.history.pushState({}, "", "/dashboard?authuser=nope&page=2");
    let sessionRequests = 0;
    server.use(
      http.get("*/api/v1/users/me", ({ request }) => {
        sessionRequests += 1;
        expect(new URL(request.url).searchParams.has("authuser")).toBe(false);
        expect(request.headers.get("X-Account-Index")).toBeNull();
        return HttpResponse.json(makeSession([]));
      }),
      http.get(
        "*/api/v1/accounts",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    resetAppQueryClient();
    const router = createRouter({
      routeTree,
      history: createBrowserHistory(),
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.status).toBe("idle");
      expect(router.state.location.pathname).toBe("/dashboard");
      expect(router.state.location.searchStr).not.toContain("authuser");
    });
    expect(window.location.pathname).toBe("/dashboard");
    expect(window.location.search).not.toContain("authuser");
    expect(window.location.search).toContain("page=2");
    expect(router.state.location.href).toContain("page=2");
    expect(sessionRequests).toBeGreaterThan(0);
    expect(
      await screen.findByRole("heading", {
        name: "Welcome to ktor-tanstack-router-template",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "ログイン" }),
    ).not.toBeInTheDocument();
  });
});
