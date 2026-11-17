import { queryOptions } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { getSelfV1 } from "@/api/generated/default/default";
import type { LoginResponse } from "@/api/generated/schemas/loginResponse";
import type { UserSession } from "@/api/generated/schemas/userSession";
import {
  accountIndexSelection,
  effectiveAccountIndex,
  holdReauthAccount,
  isAccountReauthRequired,
  pinAccountIndex,
  readPinnedAccountIndex,
} from "@/lib/authuser";
import { queryClient } from "@/routes/__root";

export class PinAccountError extends Error {
  constructor(message = "Could not resolve which signed-in account to use") {
    super(message);
    this.name = "PinAccountError";
  }
}

export function sessionFromLogin(response: LoginResponse): UserSession {
  return { user: response.user, permissions: response.permissions };
}

export const selfQueryOptions = queryOptions({
  queryKey: ["self"],
  queryFn: async () => {
    const self = await getSelfV1();
    if (self.status === 200) return self.data;
    throw new Error("Failed to fetch self data");
  },
  staleTime: 1000 * 60,
});

export async function loadSession() {
  try {
    await pinDisplayedAccount();
  } catch (error) {
    if (error instanceof PinAccountError) return null;
    throw error;
  }
  try {
    return await queryClient.ensureQueryData(selfQueryOptions);
  } catch (error) {
    if (!isReauthError(error)) return null;
    const index = effectiveAccountIndex(
      typeof window === "undefined" ? "" : window.location.search,
    );
    if (index !== undefined) holdReauthAccount(index);
    queryClient.removeQueries({ queryKey: selfQueryOptions.queryKey });
    try {
      return await queryClient.fetchQuery(selfQueryOptions);
    } catch {
      return null;
    }
  }
}

/** Remember the account this page loaded so later requests do not follow a default chosen by another tab. */
export async function pinDisplayedAccount() {
  if (typeof window === "undefined") return;
  const selection = accountIndexSelection(window.location.search);
  if (selection.kind === "valid") {
    pinAccountIndex(selection.index);
    return;
  }
  if (selection.kind !== "absent" || readPinnedAccountIndex() !== undefined) {
    return;
  }
  try {
    const response = await fetch("/api/v1/accounts", {
      credentials: "same-origin",
    });
    if (!response.ok) throw new PinAccountError();
    const accounts: unknown = await response.json();
    if (!Array.isArray(accounts)) throw new PinAccountError();
    const usable = accounts.filter(isUsableAccount);
    const chosen = usable.find((account) => account.isDefault) ?? usable[0];
    if (!chosen) throw new PinAccountError();
    pinAccountIndex(chosen.index);
  } catch (error) {
    if (error instanceof PinAccountError) throw error;
    throw new PinAccountError();
  }
}

function isUsableAccount(
  value: unknown,
): value is { index: number; isDefault: boolean; requiresReauth?: boolean } {
  if (value == null || typeof value !== "object") return false;
  const account = value as {
    index?: unknown;
    isDefault?: unknown;
    requiresReauth?: unknown;
  };
  return (
    typeof account.index === "number" &&
    Number.isInteger(account.index) &&
    account.index >= 0 &&
    account.index <= 9 &&
    account.requiresReauth !== true
  );
}

function isReauthError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    isAccountReauthRequired(error.status, error.data)
  );
}
