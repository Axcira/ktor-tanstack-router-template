import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";
import { AccountAuthDialog } from "@/components/AccountAuthDialog";
import {
  AccountLogoutDialog,
  AccountSwitcherList,
  activeAccountIndex,
  nextLogoutDialogState,
  SignOutAllDialog,
} from "@/components/layout/header/AccountSwitcher";
import {
  closeAccountDialog,
  openAccountDialog,
  useAccountDialog,
} from "@/lib/account-dialog";
import { accountNavigation } from "@/lib/authuser";
import { createTestQueryClient } from "@/test/render";

const accounts: AccountSummary[] = [
  {
    index: 0,
    displayName: "ada",
    email: "ada@example.com",
    avatarUrl: null,
    isDefault: false,
    requiresReauth: false,
  },
  {
    index: 2,
    displayName: "grace",
    email: "grace@example.com",
    avatarUrl: null,
    isDefault: true,
    requiresReauth: false,
  },
];

const expired: AccountSummary = {
  index: 1,
  displayName: "expired",
  email: "expired@example.com",
  avatarUrl: null,
  isDefault: false,
  requiresReauth: true,
};

function accountRow(email: string) {
  return screen.getByRole("button", {
    name: (name) =>
      name.includes(email) &&
      !name.includes("ログアウト") &&
      !name.includes("に再ログイン"),
  });
}

function DialogMirror() {
  const request = useAccountDialog();
  if (!request) return null;
  return (
    <AccountAuthDialog
      open
      mode={request.mode}
      email={request.mode === "reauth" ? request.email : ""}
      onOpenChange={(open) => {
        if (!open) closeAccountDialog();
      }}
      onSuccess={() => {
        accountNavigation.assign("/should-not-navigate");
      }}
    />
  );
}

function SwitcherHarness({
  authuser,
  listed = accounts,
  onSwitch,
  onLogout,
}: {
  authuser?: number;
  listed?: AccountSummary[];
  onSwitch: (index: number) => void;
  onLogout: (index: number) => void;
}) {
  const [logoutDialog, setLogoutDialog] = useState<{
    account: AccountSummary | null;
    open: boolean;
  }>({ account: null, open: false });
  const [signOutOpen, setSignOutOpen] = useState(false);
  return (
    <>
      <AccountSwitcherList
        accounts={listed}
        activeIndex={activeAccountIndex(authuser, listed)}
        onSwitch={onSwitch}
        onReauth={(account) => {
          openAccountDialog({
            mode: "reauth",
            email: account.email,
            index: account.index,
          });
        }}
        onAddAccount={() => {
          openAccountDialog({ mode: "add" });
        }}
        onLogoutRequest={(index) => {
          const account = listed.find((item) => item.index === index);
          if (!account) return;
          setLogoutDialog((state) =>
            nextLogoutDialogState(state, { type: "request", account }),
          );
        }}
        onSignOutAllRequest={() => setSignOutOpen(true)}
      />
      <AccountLogoutDialog
        account={logoutDialog.account}
        open={logoutDialog.open}
        pending={false}
        onOpenChange={(open) => {
          setLogoutDialog((state) =>
            nextLogoutDialogState(state, { type: "open", open }),
          );
        }}
        onOpenChangeComplete={(open) => {
          if (!open) {
            setLogoutDialog((state) =>
              nextLogoutDialogState(state, { type: "closed" }),
            );
          }
        }}
        onConfirm={() => {
          if (logoutDialog.account) onLogout(logoutDialog.account.index);
        }}
      />
      <SignOutAllDialog
        open={signOutOpen}
        pending={false}
        onOpenChange={setSignOutOpen}
        onConfirm={() => {}}
      />
      <DialogMirror />
    </>
  );
}

async function renderSwitcher(
  authuser?: number,
  listed: AccountSummary[] = accounts,
) {
  const onSwitch = vi.fn();
  const onLogout = vi.fn();
  const queryClient = createTestQueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <SwitcherHarness
        authuser={authuser}
        listed={listed}
        onSwitch={onSwitch}
        onLogout={onLogout}
      />
    ),
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    validateSearch: (search: Record<string, unknown>) =>
      search.addAccount === true ? { addAccount: true as const } : {},
    component: () => <div>Login</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, loginRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("button", { name: "アカウントを追加" });
  return { onSwitch, onLogout, user: userEvent.setup(), router };
}

describe("account switcher", () => {
  afterEach(() => {
    closeAccountDialog();
  });

  it("uses the URL index when it matches a signed-in account, otherwise the default", () => {
    expect(activeAccountIndex(0, accounts)).toBe(0);
    expect(activeAccountIndex(4, accounts)).toBe(2);
    expect(activeAccountIndex(undefined, accounts)).toBe(2);
    expect(activeAccountIndex(1, [...accounts, expired])).toBe(2);
  });

  it("keeps the logout target until the dialog has finished closing", () => {
    const grace = accounts[1];
    const requested = nextLogoutDialogState(
      { account: null, open: false },
      { type: "request", account: grace },
    );
    const closing = nextLogoutDialogState(requested, {
      type: "open",
      open: false,
    });
    expect(closing.account?.email).toBe("grace@example.com");
    expect(closing.open).toBe(false);
    expect(
      nextLogoutDialogState(closing, { type: "closed" }).account,
    ).toBeNull();
  });

  it("marks the active account and offers logout only on the others", async () => {
    const { onSwitch, user } = await renderSwitcher(0);

    expect(accountRow("ada@example.com")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "ada@example.com からログアウト" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "grace@example.com からログアウト" }),
    ).toBeInTheDocument();

    await user.click(accountRow("ada@example.com"));
    expect(onSwitch).not.toHaveBeenCalled();

    await user.click(accountRow("grace@example.com"));
    expect(onSwitch).toHaveBeenCalledWith(2);
  });

  it("confirms logout of an inactive account and keeps the email while the dialog closes", async () => {
    const { user, onLogout } = await renderSwitcher(0);

    await user.click(
      screen.getByRole("button", { name: "grace@example.com からログアウト" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "このアカウントからログアウトしますか？",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/grace@example.com だけサインアウトします/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(onLogout).toHaveBeenCalledWith(2);
    expect(
      screen.getByRole("heading", {
        name: "このアカウントからログアウトしますか？",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(
      screen.queryByRole("heading", {
        name: "このアカウントからログアウトしますか？",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens an add-account dialog and leaves the page alone when cancelled", async () => {
    const assign = vi
      .spyOn(accountNavigation, "assign")
      .mockImplementation(() => {});
    const { user, router } = await renderSwitcher(0);

    await user.click(screen.getByRole("button", { name: "アカウントを追加" }));
    expect(
      await screen.findByRole("heading", { name: "アカウントを追加" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(router.state.location.pathname).toBe("/");
    expect(assign).not.toHaveBeenCalled();
  });

  it("opens a re-login dialog with the email filled in and does not switch", async () => {
    const assign = vi
      .spyOn(accountNavigation, "assign")
      .mockImplementation(() => {});
    const { user, onSwitch } = await renderSwitcher(0, [...accounts, expired]);

    expect(screen.getByText("再ログインが必要")).toBeInTheDocument();
    await user.click(accountRow("expired@example.com"));
    expect(onSwitch).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "再ログイン" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveValue(
      "expired@example.com",
    );
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(assign).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: "expired@example.com からログアウト",
      }),
    ).toBeInTheDocument();
  });
});
