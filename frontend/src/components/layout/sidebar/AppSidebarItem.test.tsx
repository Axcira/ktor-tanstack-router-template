import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

function mockViewport(initialWidth: number) {
  let width = initialWidth;
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.matchMedia = (query: string) => ({
    matches: query.includes("max-width") ? width < 768 : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => false,
  });

  return {
    resize(next: number) {
      width = next;
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: next,
      });
      for (const listener of listeners) listener();
    },
  };
}

describe("AppSidebar authorization", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("hides Administration when ManageUsers is denied", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "CreateArticle" }])),
      denyCanI(),
    );

    await renderApp("/");

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("keeps parent menu labels in the mobile sheet after the desktop sidebar was collapsed", async () => {
    const viewport = mockViewport(1024);
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      denyCanI(),
    );

    await renderApp("/");

    await waitFor(() => {
      expect(screen.getByText("Articles")).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "サイドバーの切り替え" }),
    );
    await waitFor(() => {
      expect(screen.queryByText("Articles")).not.toBeInTheDocument();
    });

    viewport.resize(624);
    await userEvent.click(screen.getByRole("button", { name: "メニュー" }));

    expect(
      await screen.findByRole("button", { name: "Articles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Showcase" }),
    ).toBeInTheDocument();
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
