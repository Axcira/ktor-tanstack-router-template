import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Permission } from "@/api/generated/schemas";
import { checkPermission } from "@/lib/permissions";
import { server } from "@/test/msw";
import { makeSession } from "@/test/session";

function canISpy(status: 200 | 403) {
  const spy = vi.fn();
  server.use(
    http.post("*/api/v1/permissions/can-i", async ({ request }) => {
      spy(await request.json());
      return new HttpResponse(null, { status });
    }),
  );
  return spy;
}

describe("checkPermission", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true locally for a matching static permission without calling can-i", async () => {
    const spy = canISpy(403);
    const session = makeSession([{ type: "ManageUsers" }]);

    await expect(
      checkPermission(session, { type: "ManageUsers" }),
    ).resolves.toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it("delegates to can-i when ManageArticles is present but CreateArticle is requested", async () => {
    const spy = canISpy(200);
    const session = makeSession([{ type: "ManageArticles" }]);

    await expect(
      checkPermission(session, { type: "CreateArticle" }),
    ).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith({ type: "CreateArticle" });
  });

  it("returns false when can-i responds 403 for delegated checks", async () => {
    canISpy(403);
    const session = makeSession([{ type: "ManageArticles" }]);

    await expect(
      checkPermission(session, { type: "CreateArticle" }),
    ).resolves.toBe(false);
  });

  it("always delegates Administrator-only sessions for other permission types", async () => {
    const spy = canISpy(200);
    const session = makeSession([{ type: "Administrator" }]);

    await expect(
      checkPermission(session, { type: "CreateArticle" }),
    ).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith({ type: "CreateArticle" });
  });

  it("always calls can-i for parameterized permissions", async () => {
    const spy = canISpy(200);
    const session = makeSession([
      { type: "UpdateArticle", allowOthers: true } as Permission,
    ]);
    const required = {
      type: "UpdateArticle",
      allowOthers: true,
    } as Permission;

    await expect(checkPermission(session, required)).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith(required);
  });

  it("returns false when can-i throws", async () => {
    server.use(
      http.post("*/api/v1/permissions/can-i", () => HttpResponse.error()),
    );
    const session = makeSession([]);

    await expect(
      checkPermission(session, { type: "CreateArticle" }),
    ).resolves.toBe(false);
  });
});
