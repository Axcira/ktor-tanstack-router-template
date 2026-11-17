import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_REAUTH_REQUIRED,
  accountNavigation,
  resetAccountIndexRecovery,
} from "@/lib/authuser";
import { loadSession } from "@/lib/self";
import { queryClient } from "@/routes/__root";
import { server } from "@/test/msw";

describe("loadSession", () => {
  afterEach(() => {
    resetAccountIndexRecovery();
    queryClient.clear();
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("stays on a usable account when the URL index needs another sign-in", async () => {
    window.history.pushState({}, "", "/dashboard?authuser=1");
    const assign = vi
      .spyOn(accountNavigation, "assign")
      .mockImplementation(() => {});
    server.use(
      http.get("*/api/v1/users/me", ({ request }) => {
        if (request.headers.get("X-Account-Index") === "1") {
          return HttpResponse.json(
            { code: ACCOUNT_REAUTH_REQUIRED, message: "sign in again" },
            { status: 401 },
          );
        }
        return HttpResponse.json({
          user: { id: 2, email: "ok@example.com", roleId: 1 },
          permissions: [],
        });
      }),
    );

    const session = await loadSession();

    expect(session?.user.email).toBe("ok@example.com");
    expect(assign).not.toHaveBeenCalled();
  });
});
