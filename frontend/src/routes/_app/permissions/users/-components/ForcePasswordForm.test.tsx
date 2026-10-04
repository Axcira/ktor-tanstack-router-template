import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  getGetRolesV1MockHandler,
  getGetSelfV1MockHandler,
  getGetUsersV1MockHandler,
} from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("Force password change", () => {
  it("lets an administrator set a new password and choose to drop every session", async () => {
    const calls: { id?: string; body: unknown }[] = [];
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      denyCanI(),
      getGetUsersV1MockHandler([
        { id: 7, email: "other@example.com", roleId: 2 },
      ]),
      getGetRolesV1MockHandler([
        {
          id: 2,
          name: "Writer",
          description: "Writer",
          permissions: [],
        },
      ]),
      http.post("*/api/v1/users/:id/password", async ({ request, params }) => {
        calls.push({
          id: String(params.id),
          body: await request.json(),
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    await renderApp("/permissions/users/7/edit");

    expect(
      await screen.findByRole("heading", { name: "パスワードの強制変更" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("現在のパスワード")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("新しいパスワード"), "replacement-1");
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "different-1",
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "確認用パスワードが一致しません",
    );
    expect(calls).toHaveLength(0);

    await user.clear(screen.getByLabelText("新しいパスワード（確認）"));
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "replacement-1",
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    await waitFor(() => {
      expect(calls).toEqual([
        {
          id: "7",
          body: {
            newPassword: "replacement-1",
            logoutSessions: true,
          },
        },
      ]);
    });

    await user.type(screen.getByLabelText("新しいパスワード"), "replacement-2");
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "replacement-2",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "対象ユーザーの全セッションからログアウトする",
      }),
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    await waitFor(() => {
      expect(calls[1]).toEqual({
        id: "7",
        body: {
          newPassword: "replacement-2",
          logoutSessions: false,
        },
      });
    });
  });

  it("says the user is missing only for 404", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      denyCanI(),
      getGetUsersV1MockHandler([
        { id: 7, email: "other@example.com", roleId: 2 },
      ]),
      getGetRolesV1MockHandler([
        {
          id: 2,
          name: "Writer",
          description: "Writer",
          permissions: [],
        },
      ]),
      http.post("*/api/v1/users/:id/password", () =>
        HttpResponse.json("User not found", { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    await renderApp("/permissions/users/7/edit");
    await user.type(
      await screen.findByLabelText("新しいパスワード"),
      "replacement-1",
    );
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "replacement-1",
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ユーザーが見つかりません",
    );

    server.use(
      http.post(
        "*/api/v1/users/:id/password",
        () => new HttpResponse(null, { status: 403 }),
      ),
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "パスワードの変更に失敗しました",
    );
    expect(
      screen.queryByText("ユーザーが見つかりません"),
    ).not.toBeInTheDocument();
  });
});
