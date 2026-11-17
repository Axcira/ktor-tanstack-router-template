export const ACCOUNT_INDEX_HEADER = "X-Account-Index";
export const ACCOUNT_INDEX_INVALID = "ACCOUNT_INDEX_INVALID";
export const ACCOUNT_LIMIT_REACHED = "ACCOUNT_LIMIT_REACHED";

const MAX_ACCOUNT_INDEX = 9;

/** Browser navigation used by account switching. Tests replace these two methods. */
export const accountNavigation = {
  href: () => window.location.href,
  assign: (url: string) => {
    window.location.assign(url);
  },
};

export function parseAuthUser(value: unknown): number | undefined {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_ACCOUNT_INDEX
  ) {
    return value;
  }
  if (typeof value === "string" && /^[0-9]$/.test(value)) {
    return Number(value);
  }
  return undefined;
}

export function readAuthUser(search: string): number | undefined {
  return parseAuthUser(
    new URLSearchParams(search).get("authuser") ?? undefined,
  );
}

export function mergeAccountIndex(
  init: RequestInit | undefined,
  search: string,
): RequestInit {
  const index = readAuthUser(search);
  if (index === undefined) return init ?? {};
  const headers = new Headers(init?.headers);
  headers.set(ACCOUNT_INDEX_HEADER, String(index));
  return { ...init, headers };
}

export function accountSwitchUrl(href: string, index: number): string {
  const url = new URL(href);
  url.searchParams.set("authuser", String(index));
  return url.toString();
}

export function signedInAccountUrl(origin: string, index: number): string {
  const url = new URL("/dashboard", origin);
  url.searchParams.set("authuser", String(index));
  return url.toString();
}

export function clearedAuthUserUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("authuser");
  return url.toString();
}

export function isAccountIndexInvalid(status: number, data: unknown): boolean {
  if (status !== 401 || data == null || typeof data !== "object") return false;
  return (data as { code?: unknown }).code === ACCOUNT_INDEX_INVALID;
}

export function isAccountLimitReached(status: number, data: unknown): boolean {
  if (status !== 409 || data == null || typeof data !== "object") return false;
  return (data as { code?: unknown }).code === ACCOUNT_LIMIT_REACHED;
}

let recovering = false;

export function resetAccountIndexRecovery() {
  recovering = false;
}

/**
 * An explicit authuser that the server rejected is dropped. If this browser still
 * has a signed-in account, reload without the index so the default account is used.
 * Otherwise send the user to the login screen.
 */
export async function recoverInvalidAccountIndex(
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (recovering) return;
  recovering = true;
  try {
    const response = await fetchImpl("/api/v1/accounts", {
      credentials: "same-origin",
    });
    if (!response.ok) {
      accountNavigation.assign("/login");
      return;
    }
    const accounts: unknown = await response.json();
    if (!Array.isArray(accounts) || accounts.length === 0) {
      accountNavigation.assign("/login");
      return;
    }
    accountNavigation.assign(clearedAuthUserUrl(accountNavigation.href()));
  } catch {
    accountNavigation.assign("/login");
  }
}
