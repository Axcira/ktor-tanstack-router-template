import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { renderApp } from "@/test/app";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("invalid authuser", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("removes an illegal authuser before the page renders", async () => {
    window.history.pushState({}, "", "/dashboard?page=2");
    server.use(
      http.get("*/api/v1/users/me", () => HttpResponse.json(makeSession([]))),
    );

    const { router } = await renderApp("/dashboard?authuser=nope&page=2");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
      expect(router.state.location.searchStr).not.toContain("authuser");
    });
    expect(router.state.location.href).toContain("page=2");
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
