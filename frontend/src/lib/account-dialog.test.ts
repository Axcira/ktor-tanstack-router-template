import { afterEach, describe, expect, it } from "vitest";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";
import {
  fallbackAccountIndex,
  LAST_USABLE_AUTHUSER_KEY,
  rememberUsableAccount,
} from "@/lib/account-dialog";

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

describe("fallbackAccountIndex", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("uses the default account when nothing was saved", () => {
    expect(fallbackAccountIndex(accounts, 9)).toBe(2);
  });

  it("uses a saved index of 0", () => {
    rememberUsableAccount(0);
    expect(fallbackAccountIndex(accounts, 9)).toBe(0);
  });

  it("ignores a blank saved value", () => {
    sessionStorage.setItem(LAST_USABLE_AUTHUSER_KEY, "");
    expect(fallbackAccountIndex(accounts, 9)).toBe(2);
  });
});
