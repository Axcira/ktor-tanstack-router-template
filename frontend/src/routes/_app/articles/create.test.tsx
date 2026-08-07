import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("ArticleCreatePage authorization", () => {
  it("shows NoPermission when CreateArticle is denied", async () => {
    server.use(getGetSelfV1MockHandler(makeSession([])), denyCanI());

    await renderApp("/articles/create");

    await waitFor(() => {
      expect(screen.getByText("権限がありません。")).toBeInTheDocument();
    });
  });
});
