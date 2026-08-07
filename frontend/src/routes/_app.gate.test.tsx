import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("auth and permission gates", () => {
  it("redirects unauthenticated users from /_app routes to /hero", async () => {
    server.use(
      http.get(
        "*/api/v1/users/me",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    const { router } = await renderApp("/articles");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/hero");
    });
  });

  it("redirects users without ManageUsers away from /permissions/users", async () => {
    server.use(getGetSelfV1MockHandler(makeSession([])), denyCanI());

    const { router } = await renderApp("/permissions/users");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });

  it("allows ManageUsers sessions into /permissions/users", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      http.get("*/api/v1/users", () => HttpResponse.json([])),
      http.get("*/api/v1/roles", () => HttpResponse.json([])),
      denyCanI(),
    );

    const { router } = await renderApp("/permissions/users");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/permissions/users");
      expect(screen.getByText("ユーザー管理")).toBeInTheDocument();
    });
  });
});
