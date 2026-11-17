import { HttpResponse, http } from "msw";
import { getListAccountsV1MockHandler } from "@/api/generated/default/default.msw";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";
import { resetAccountIndexRecovery } from "@/lib/authuser";
import { queryClient as appQueryClient } from "@/routes/__root";

/** Stable list for loadSession pinning when tests hit app routes without authuser. */
export const USABLE_TEST_ACCOUNTS: AccountSummary[] = [
  {
    index: 0,
    displayName: "Test",
    email: "test@example.com",
    avatarUrl: null,
    isDefault: true,
    requiresReauth: false,
  },
];

export function usableAccountsHandler() {
  return getListAccountsV1MockHandler(USABLE_TEST_ACCOUNTS);
}

export function denyCanI() {
  return http.post(
    "*/api/v1/permissions/can-i",
    () => new HttpResponse(null, { status: 403 }),
  );
}

export function allowCanI() {
  return http.post(
    "*/api/v1/permissions/can-i",
    () => new HttpResponse(null, { status: 200 }),
  );
}

export function resetAppQueryClient() {
  resetAccountIndexRecovery();
  appQueryClient.clear();
  appQueryClient.setDefaultOptions({
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  });
}
