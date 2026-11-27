import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import type { TagMasterDTO } from "@/api/generated/schemas/tagMasterDTO";
import { renderApp } from "@/test/app";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

const tags: TagMasterDTO[] = [
  {
    id: 1,
    name: "お知らせ",
    sortKey: "a0",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "技術",
    sortKey: "a1",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

function masterCanI(allowed: string[]) {
  return http.post("*/api/v1/permissions/can-i", async ({ request }) => {
    const body = (await request.json()) as { type?: string; masterId?: string };
    const ok =
      body.type === "ManageMasters" &&
      typeof body.masterId === "string" &&
      allowed.includes(body.masterId);
    return new HttpResponse(null, { status: ok ? 200 : 403 });
  });
}

function tagList() {
  return http.get("*/api/v1/tags", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const items = tags.filter((tag) => tag.name.includes(q));
    return HttpResponse.json({ items, totalCount: items.length });
  });
}

describe("tag master screen", () => {
  it("lists tags, filters on the server, and hides masters the user cannot manage", async () => {
    const user = userEvent.setup();
    server.use(
      getGetSelfV1MockHandler(makeSession()),
      masterCanI(["tags", "customers"]),
      tagList(),
    );

    const { router } = await renderApp("/masters");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/masters/tags");
    });
    expect(await screen.findByText("お知らせ")).toBeInTheDocument();
    expect(screen.getByText("技術")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "タグ" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/masters\/tags(?:\?|$)/),
    );
    expect(screen.getByRole("tab", { name: "顧客" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "製品" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "検索" }), "技術");

    await waitFor(() => {
      expect(screen.queryByText("お知らせ")).not.toBeInTheDocument();
    });
    expect(screen.getByText("技術")).toBeInTheDocument();
    expect(
      screen.getByText("絞り込み中は並び替えできません。"),
    ).toBeInTheDocument();
  });

  it("sends a visitor without the tag master to the first master they can open", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession()),
      masterCanI(["customers"]),
      http.get("*/api/v1/customers", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
    );

    const { router } = await renderApp("/masters/tags");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/masters/customers");
    });
    expect(screen.getByRole("tab", { name: "顧客" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "タグ" })).not.toBeInTheDocument();
  });
});
