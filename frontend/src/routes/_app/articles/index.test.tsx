import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  getGetSelfV1MockHandler,
  getListArticlesV1MockHandler,
} from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { allowCanI, denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("ArticlesListView authorization", () => {
  it("shows create CTA when session has CreateArticle (local shortcut)", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "CreateArticle" }])),
      getListArticlesV1MockHandler([]),
      denyCanI(),
    );

    await renderApp("/articles");

    // Button render={<Link>} sets nativeButton false, so Base UI adds role="button"
    // on the anchor. The control still navigates.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /記事を書く/ }),
      ).toHaveAttribute("href", "/articles/create");
    });
    expect(screen.getByText("記事がありません。")).toBeInTheDocument();
  });

  it("shows create CTA when can-i allows CreateArticle via ManageArticles", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageArticles" }])),
      getListArticlesV1MockHandler([]),
      allowCanI(),
    );

    await renderApp("/articles");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /記事を書く/ }),
      ).toHaveAttribute("href", "/articles/create");
    });
  });

  it("hides create CTA when can-i denies CreateArticle", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([])),
      getListArticlesV1MockHandler([]),
      denyCanI(),
    );

    await renderApp("/articles");

    await waitFor(() => {
      expect(screen.getByText("記事一覧")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /記事を書く/ }),
    ).not.toBeInTheDocument();
  });

  it("shows error when articles fail to load", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "CreateArticle" }])),
      http.get("*/api/v1/articles", () => HttpResponse.error()),
      denyCanI(),
    );

    await renderApp("/articles");

    await waitFor(() => {
      expect(
        screen.getByText("記事の読み込みに失敗しました。"),
      ).toBeInTheDocument();
    });
  });
});
