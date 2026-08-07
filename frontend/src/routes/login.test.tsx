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
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLoginV1MockHandler } from "@/api/generated/default/default.msw";
import { LoginForm } from "@/components/LoginForm";
import { server } from "@/test/msw";
import { createTestQueryClient } from "@/test/render";
import { makeSession } from "@/test/session";

const toastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}));

async function renderLogin() {
  const queryClient = createTestQueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginForm,
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>Home</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, homeRoute]),
    history: createMemoryHistory({ initialEntries: ["/login"] }),
  });

  const view = render(<RouterProvider router={router} />);
  await waitFor(() => {
    expect(router.state.status).toBe("idle");
  });
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "ログイン" }),
    ).toBeInTheDocument();
  });

  return {
    router,
    user: userEvent.setup(),
    ...view,
  };
}

describe("LoginForm", () => {
  beforeEach(() => {
    toastSuccess.mockClear();
  });

  it("shows inline error on 401", async () => {
    server.use(
      http.post(
        "*/api/v1/auth/login",
        () => new HttpResponse(JSON.stringify({}), { status: 401 }),
      ),
    );

    const { user } = await renderLogin();

    await user.type(screen.getByLabelText("メールアドレス"), "a@b.com");
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスまたはパスワードが間違っています",
    );
  });

  it("toasts and navigates home on success", async () => {
    server.use(
      getLoginV1MockHandler(
        makeSession([{ type: "ManageUsers" }], { email: "a@b.com" }),
      ),
    );

    const { user, router } = await renderLogin();

    await user.type(screen.getByLabelText("メールアドレス"), "a@b.com");
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith("ログインに成功しました");
      expect(router.state.location.pathname).toBe("/");
    });
  });

  it("shows inline error when the request fails", async () => {
    server.use(http.post("*/api/v1/auth/login", () => HttpResponse.error()));

    const { user } = await renderLogin();

    await user.type(screen.getByLabelText("メールアドレス"), "a@b.com");
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ログインに失敗しました",
    );
  });
});
