import { useSyncExternalStore } from "react";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";

export const LAST_USABLE_AUTHUSER_KEY = "last-usable-authuser";

export type AccountDialogRequest =
  | { mode: "add" }
  | { mode: "reauth"; email: string; index: number };

let request: AccountDialogRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function openAccountDialog(next: AccountDialogRequest) {
  request = next;
  emit();
}

export function closeAccountDialog() {
  request = null;
  emit();
}

export function useAccountDialog(): AccountDialogRequest | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => request,
  );
}

export function rememberUsableAccount(index: number) {
  sessionStorage.setItem(LAST_USABLE_AUTHUSER_KEY, String(index));
}

export function fallbackAccountIndex(
  accounts: AccountSummary[],
  avoid: number,
): number | undefined {
  const usable = accounts.filter(
    (account) => !account.requiresReauth && account.index !== avoid,
  );
  const remembered = Number(sessionStorage.getItem(LAST_USABLE_AUTHUSER_KEY));
  return (
    usable.find((account) => account.index === remembered)?.index ??
    usable.find((account) => account.isDefault)?.index ??
    usable[0]?.index
  );
}

export function activeAccountIndex(
  authuser: number | undefined,
  accounts: AccountSummary[],
): number | undefined {
  const usable = accounts.filter((account) => !account.requiresReauth);
  if (
    authuser !== undefined &&
    usable.some((account) => account.index === authuser)
  ) {
    return authuser;
  }
  return usable.find((account) => account.isDefault)?.index ?? usable[0]?.index;
}

export function reauthAccountFromUrl(
  authuser: number | undefined,
  accounts: AccountSummary[],
): AccountSummary | undefined {
  if (authuser === undefined) return undefined;
  return accounts.find(
    (account) => account.index === authuser && account.requiresReauth,
  );
}
