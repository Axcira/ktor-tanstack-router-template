import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";
import {
  AccountLogoutDialog,
  AccountSwitcherList,
  activeAccountIndex,
} from "@/components/layout/header/AccountSwitcher";
import { createTestQueryClient } from "@/test/render";

const accounts: AccountSummary[] = [
  {
    index: 0,
    displayName: "ada",
    email: "ada@example.com",
    avatarUrl: null,
    isDefault: false,
  },
  {
    index: 2,
    displayName: "grace",
    email: "grace@example.com",
    avatarUrl: null,
    isDefault: true,
  },
];

function accountRow(email: string) {
  return screen.getByRole("button", {
    name: (name) => name.includes(email) && !name.includes("ログアウト"),
  });
}

function SwitcherHarness({
  authuser,
  onSwitch,
  onLogout,
}: {
  authuser?: number;
  onSwitch: (index: number) => void;
  onLogout: (index: number) => void;
}) {
  const [logoutIndex, setLogoutIndex] = useState<number | null>(null);
  return (
    <>
      <AccountSwitcherList
        accounts={accounts}
        activeIndex={activeAccountIndex(authuser, accounts)}
        onSwitch={onSwitch}
        onLogoutRequest={setLogoutIndex}
      />
      <AccountLogoutDialog
        account={
          accounts.find((account) => account.index === logoutIndex) ?? null
        }
        pending={false}
        onOpenChange={(open) => {
          if (!open) setLogoutIndex(null);
        }}
        onConfirm={() => {
          if (logoutIndex !== null) onLogout(logoutIndex);
          setLogoutIndex(null);
        }}
      />
    </>
  );
}

async function renderSwitcher(authuser?: number) {
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
  await screen.findByRole("link", { name: "アカウントを追加" });
  return { onSwitch, onLogout, user: userEvent.setup(), router };
}

describe("account switcher", () => {
  it("uses the URL index when it matches a signed-in account, otherwise the default", () => {
    expect(activeAccountIndex(0, accounts)).toBe(0);
    expect(activeAccountIndex(4, accounts)).toBe(2);
    expect(activeAccountIndex(undefined, accounts)).toBe(2);
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

  it("confirms logout of an inactive account and links to add-account login", async () => {
    const { user, router, onLogout } = await renderSwitcher(0);

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

    await user.click(screen.getByRole("link", { name: "アカウントを追加" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
      expect(router.state.location.search).toMatchObject({ addAccount: true });
    });
  });
});
