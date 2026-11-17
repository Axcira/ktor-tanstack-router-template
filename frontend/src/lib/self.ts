import { queryOptions } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { getSelfV1 } from "@/api/generated/default/default";
import type { LoginResponse } from "@/api/generated/schemas/loginResponse";
import type { UserSession } from "@/api/generated/schemas/userSession";
import {
  accountIndexSelection,
  holdReauthAccount,
  isAccountReauthRequired,
} from "@/lib/authuser";
import { queryClient } from "@/routes/__root";

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
    return await queryClient.ensureQueryData(selfQueryOptions);
  } catch (error) {
    if (!isReauthError(error)) return null;
    const selection = accountIndexSelection(
      typeof window === "undefined" ? "" : window.location.search,
    );
    if (selection.kind === "valid") holdReauthAccount(selection.index);
    queryClient.removeQueries({ queryKey: selfQueryOptions.queryKey });
    try {
      return await queryClient.fetchQuery(selfQueryOptions);
    } catch {
      return null;
    }
  }
}

function isReauthError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    isAccountReauthRequired(error.status, error.data)
  );
}
