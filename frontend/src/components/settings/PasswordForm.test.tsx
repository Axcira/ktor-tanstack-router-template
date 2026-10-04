import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getGetSelfV1MockHandler } from "@/api/generated/default/default.msw";
import { renderApp } from "@/test/app";
import { allowCanI, denyCanI } from "@/test/handlers";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

describe("Password change settings", () => {
  it("requires ChangePassword and does not treat ManageUsers as enough", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ManageUsers" }])),
      denyCanI(),
    );

    await renderApp("/settings");

    expect(
      await screen.findByText(
        "自分のパスワードを変更するには「パスワードの変更」権限が必要です。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("現在のパスワード")).not.toBeInTheDocument();
  });

  it("shows the form when ChangePassword is granted", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ChangePassword" }])),
      denyCanI(),
    );

    await renderApp("/settings");

    expect(
      await screen.findByLabelText("現在のパスワード"),
    ).toBeInTheDocument();
  });

  it("shows the form for Administrator after can-i allows it", async () => {
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "Administrator" }])),
      allowCanI(),
    );

    await renderApp("/settings");

    expect(
      await screen.findByLabelText("現在のパスワード"),
    ).toBeInTheDocument();
  });

  it("asks for the current password and can log out other sessions", async () => {
    const calls: unknown[] = [];
    server.use(
      getGetSelfV1MockHandler(makeSession([{ type: "ChangePassword" }])),
      denyCanI(),
      http.post("*/api/v1/auth/password", async ({ request }) => {
        calls.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    await renderApp("/settings");

    await user.type(
      await screen.findByLabelText("現在のパスワード"),
      "password",
    );
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
          currentPassword: "password",
          newPassword: "replacement-1",
          logoutOtherSessions: true,
        },
      ]);
    });

    await user.type(screen.getByLabelText("現在のパスワード"), "replacement-1");
    await user.type(screen.getByLabelText("新しいパスワード"), "replacement-2");
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "replacement-2",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "他のセッションからログアウトする",
      }),
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
    await waitFor(() => {
      expect(calls[1]).toEqual({
        currentPassword: "replacement-1",
        newPassword: "replacement-2",
        logoutOtherSessions: false,
      });
    });
  });
});
