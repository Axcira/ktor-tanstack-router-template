import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_REAUTH_REQUIRED,
  accountNavigation,
  pinAccountIndex,
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

  it("pins the default account and sends that index when authuser is absent", async () => {
    window.history.pushState({}, "", "/dashboard");
    const seen: Array<string | null> = [];
    server.use(
      http.get("*/api/v1/accounts", () =>
        HttpResponse.json([
          { index: 0, isDefault: false, requiresReauth: false },
          { index: 3, isDefault: true, requiresReauth: false },
          { index: 4, isDefault: false, requiresReauth: true },
        ]),
      ),
      http.get("*/api/v1/users/me", ({ request }) => {
        seen.push(request.headers.get("X-Account-Index"));
        return HttpResponse.json({
          user: { id: 9, email: "pinned@example.com", roleId: 1 },
          permissions: [],
        });
      }),
    );

    const session = await loadSession();

    expect(session?.user.email).toBe("pinned@example.com");
    expect(seen).toEqual(["3"]);
  });

  it("does not call self when pinning the default account fails", async () => {
    window.history.pushState({}, "", "/dashboard");
    let meRequested = false;
    server.use(
      http.get("*/api/v1/accounts", () =>
        HttpResponse.json({ message: "down" }, { status: 503 }),
      ),
      http.get("*/api/v1/users/me", () => {
        meRequested = true;
        return HttpResponse.json({
          user: { id: 1, email: "nope@example.com", roleId: 1 },
          permissions: [],
        });
      }),
    );

    const session = await loadSession();

    expect(session).toBeNull();
    expect(meRequested).toBe(false);
  });

  it("retries self on another account when the pinned index needs another sign-in", async () => {
    window.history.pushState({}, "", "/dashboard");
    pinAccountIndex(4);
    server.use(
      http.get("*/api/v1/users/me", ({ request }) => {
        if (request.headers.get("X-Account-Index") === "4") {
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
  });
});
