import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, customFetch } from "@/api/client";
import {
  ACCOUNT_INDEX_INVALID,
  accountNavigation,
  resetAccountIndexRecovery,
} from "@/lib/authuser";
import { server } from "@/test/msw";

describe("customFetch account index", () => {
  afterEach(() => {
    resetAccountIndexRecovery();
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("sends X-Account-Index from the current URL", async () => {
    window.history.pushState({}, "", "/dashboard?authuser=3");
    let header: string | null = null;
    server.use(
      http.get("*/api/v1/users/me", ({ request }) => {
        header = request.headers.get("X-Account-Index");
        return HttpResponse.json({ user: { id: 1 }, permissions: [] });
      }),
    );

    await customFetch("/api/v1/users/me");

    expect(header).toBe("3");
  });

  it("omits X-Account-Index when authuser is absent", async () => {
    window.history.pushState({}, "", "/dashboard");
    let header: string | null = "unset";
    server.use(
      http.get("*/api/v1/users/me", ({ request }) => {
        header = request.headers.get("X-Account-Index");
        return HttpResponse.json({ user: { id: 1 }, permissions: [] });
      }),
    );

    await customFetch("/api/v1/users/me");

    expect(header).toBeNull();
  });

  it("starts recovery when the selected account index is rejected", async () => {
    window.history.pushState({}, "", "/dashboard?authuser=8");
    vi.spyOn(accountNavigation, "assign").mockImplementation(() => {});
    let accountListRequested = false;
    server.use(
      http.get("*/api/v1/users/me", () =>
        HttpResponse.json(
          { code: ACCOUNT_INDEX_INVALID, message: "gone" },
          { status: 401 },
        ),
      ),
      http.get("*/api/v1/accounts", () => {
        accountListRequested = true;
        return HttpResponse.json([], { status: 401 });
      }),
    );

    await expect(customFetch("/api/v1/users/me")).rejects.toBeInstanceOf(
      ApiError,
    );
    await viWaitFor(() => accountListRequested);
  });
});

async function viWaitFor(ready: () => boolean) {
  const started = Date.now();
  while (!ready()) {
    if (Date.now() - started > 1000) {
      throw new Error("timed out waiting for account recovery");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
