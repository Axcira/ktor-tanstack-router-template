export const ACCOUNT_INDEX_HEADER = "X-Account-Index";
export const ACCOUNT_INDEX_INVALID = "ACCOUNT_INDEX_INVALID";
export const ACCOUNT_REAUTH_REQUIRED = "ACCOUNT_REAUTH_REQUIRED";
export const ACCOUNT_LIMIT_REACHED = "ACCOUNT_LIMIT_REACHED";
export const SESSION_SUPERSEDED = "SESSION_SUPERSEDED";

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
  const selection = accountIndexSelection(search);
  return selection.kind === "valid" ? selection.index : undefined;
}

export type AccountIndexSelection =
  | { kind: "absent" }
  | { kind: "valid"; index: number }
  | { kind: "invalid" };

/** Absent means use the default account. Invalid must not be treated as absent. */
export function accountIndexSelection(search: string): AccountIndexSelection {
  const params = new URLSearchParams(search);
  if (!params.has("authuser")) return { kind: "absent" };
  const index = parseAuthUser(params.get("authuser"));
  if (index === undefined) return { kind: "invalid" };
  return { kind: "valid", index };
}

let heldReauthIndex: number | undefined;

/** While this index needs another sign-in, requests use the default account instead. */
export function holdReauthAccount(index: number) {
  heldReauthIndex = index;
}

export function reauthHoldIndex(): number | undefined {
  return heldReauthIndex;
}

export function clearReauthHold() {
  heldReauthIndex = undefined;
}

export function mergeAccountIndex(
  init: RequestInit | undefined,
  search: string,
): RequestInit {
  const selection = accountIndexSelection(search);
  if (selection.kind !== "valid" || selection.index === heldReauthIndex) {
    return init ?? {};
  }
  const headers = new Headers(init?.headers);
  headers.set(ACCOUNT_INDEX_HEADER, String(selection.index));
  return { ...init, headers };
}

/**
 * Same URL with an illegal authuser removed. Null when the query is absent or a real index.
 * Relative hrefs stay relative so a router redirect does not change the origin.
 */
export function invalidAuthUserHref(href: string): string | null {
  const url = new URL(href, "http://localhost");
  if (accountIndexSelection(url.search).kind !== "invalid") return null;
  url.searchParams.delete("authuser");
  const path = `${url.pathname}${url.search}${url.hash}`;
  if (/^https?:/i.test(href)) return url.toString();
  return path;
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

export function isAccountReauthRequired(
  status: number,
  data: unknown,
): boolean {
  if (status !== 401 || data == null || typeof data !== "object") return false;
  return (data as { code?: unknown }).code === ACCOUNT_REAUTH_REQUIRED;
}

export function isAccountLimitReached(status: number, data: unknown): boolean {
  if (status !== 409 || data == null || typeof data !== "object") return false;
  return (data as { code?: unknown }).code === ACCOUNT_LIMIT_REACHED;
}

export function isSessionSuperseded(status: number, data: unknown): boolean {
  if (status !== 409 || data == null || typeof data !== "object") return false;
  return (data as { code?: unknown }).code === SESSION_SUPERSEDED;
}

let recovering = false;

export function resetAccountIndexRecovery() {
  recovering = false;
  heldReauthIndex = undefined;
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
