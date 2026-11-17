import {
  ACCOUNT_INDEX_INVALID,
  accountIndexSelection,
  effectiveAccountIndex,
  holdReauthAccount,
  isAccountIndexInvalid,
  isAccountReauthRequired,
  mergeAccountIndex,
  recoverInvalidAccountIndex,
} from "@/lib/authuser";

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T;
  readonly headers: Headers;

  constructor(status: number, data: T, headers: Headers, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.headers = headers;
  }
}

export type ErrorType<Error> = ApiError<Error>;

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const search = typeof window === "undefined" ? "" : window.location.search;
  if (
    typeof window !== "undefined" &&
    accountIndexSelection(search).kind === "invalid"
  ) {
    void recoverInvalidAccountIndex();
    throw new ApiError(
      401,
      {
        code: ACCOUNT_INDEX_INVALID,
        message: "The selected account is not signed in on this browser.",
      },
      new Headers(),
    );
  }
  const res = await fetch(url, mergeAccountIndex(options, search));
  const isNoBody = [204, 205, 304].includes(res.status);
  const body = isNoBody ? null : await res.text();

  let data: unknown;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = body;
    }
  } else if (!isNoBody) {
    data = {};
  }

  if (!res.ok) {
    if (
      typeof window !== "undefined" &&
      isAccountReauthRequired(res.status, data)
    ) {
      const index = effectiveAccountIndex(search);
      if (index !== undefined) holdReauthAccount(index);
    } else if (
      typeof window !== "undefined" &&
      isAccountIndexInvalid(res.status, data)
    ) {
      void recoverInvalidAccountIndex();
    }
    throw new ApiError(res.status, data, res.headers);
  }

  return {
    data,
    status: res.status,
    headers: res.headers,
  } as T;
};
