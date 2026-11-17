import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_INDEX_HEADER,
  accountNavigation,
  accountSwitchUrl,
  clearedAuthUserUrl,
  isAccountIndexInvalid,
  isAccountLimitReached,
  mergeAccountIndex,
  parseAuthUser,
  readAuthUser,
  recoverInvalidAccountIndex,
  resetAccountIndexRecovery,
  signedInAccountUrl,
} from "@/lib/authuser";

describe("authuser", () => {
  afterEach(() => {
    resetAccountIndexRecovery();
    vi.restoreAllMocks();
  });

  it("parses only indexes 0 through 9", () => {
    expect(parseAuthUser(0)).toBe(0);
    expect(parseAuthUser(9)).toBe(9);
    expect(parseAuthUser("3")).toBe(3);
    expect(parseAuthUser(10)).toBeUndefined();
    expect(parseAuthUser(-1)).toBeUndefined();
    expect(parseAuthUser("01")).toBeUndefined();
    expect(parseAuthUser("nope")).toBeUndefined();
    expect(parseAuthUser(1.5)).toBeUndefined();
    expect(readAuthUser("?authuser=4&page=2")).toBe(4);
    expect(readAuthUser("?page=2")).toBeUndefined();
  });

  it("sets X-Account-Index only when authuser is present", () => {
    const withIndex = mergeAccountIndex(
      { headers: { Accept: "application/json" } },
      "?authuser=2",
    );
    const headers = new Headers(withIndex.headers);
    expect(headers.get(ACCOUNT_INDEX_HEADER)).toBe("2");
    expect(headers.get("Accept")).toBe("application/json");

    const without = mergeAccountIndex(undefined, "");
    expect(new Headers(without.headers).has(ACCOUNT_INDEX_HEADER)).toBe(false);
  });

  it("builds switch and add-account urls", () => {
    expect(accountSwitchUrl("http://localhost/articles?page=2", 1)).toBe(
      "http://localhost/articles?page=2&authuser=1",
    );
    expect(signedInAccountUrl("http://localhost", 3)).toBe(
      "http://localhost/dashboard?authuser=3",
    );
    expect(
      clearedAuthUserUrl("http://localhost/articles?authuser=1&page=2"),
    ).toBe("http://localhost/articles?page=2");
  });

  it("recognizes the account error codes", () => {
    expect(isAccountIndexInvalid(401, { code: "ACCOUNT_INDEX_INVALID" })).toBe(
      true,
    );
    expect(isAccountIndexInvalid(401, { code: "OTHER" })).toBe(false);
    expect(isAccountIndexInvalid(403, { code: "ACCOUNT_INDEX_INVALID" })).toBe(
      false,
    );
    expect(isAccountLimitReached(409, { code: "ACCOUNT_LIMIT_REACHED" })).toBe(
      true,
    );
  });

  it("drops authuser and reloads when another account is still signed in", async () => {
    const assign = vi
      .spyOn(accountNavigation, "assign")
      .mockImplementation(() => {});
    vi.spyOn(accountNavigation, "href").mockReturnValue(
      "http://localhost/dashboard?authuser=4",
    );
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ index: 0 }]), { status: 200 }),
      );

    await recoverInvalidAccountIndex(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/api/v1/accounts", {
      credentials: "same-origin",
    });
    expect(assign).toHaveBeenCalledWith("http://localhost/dashboard");
  });

  it("sends the user to login when no accounts remain", async () => {
    const assign = vi
      .spyOn(accountNavigation, "assign")
      .mockImplementation(() => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await recoverInvalidAccountIndex(fetchImpl);

    expect(assign).toHaveBeenCalledWith("/login");
  });
});
