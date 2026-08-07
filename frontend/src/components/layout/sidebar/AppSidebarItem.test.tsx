import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("AppSidebar authorization", () => {
  it("hides Administration when ManageUsers is denied", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "CreateArticle" }])),
      denyCanI(),
    );

    await renderApp("/");

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("shows Administration when ManageUsers is on the session", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      denyCanI(),
    );

    await renderApp("/");

    await waitFor(() => {
      expect(screen.getByText("Administration")).toBeInTheDocument();
    });
  });
});
