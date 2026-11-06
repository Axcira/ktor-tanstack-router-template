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
  const res = await fetch(url, options);
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
    throw new ApiError(res.status, data, res.headers);
  }

  return {
    data,
    status: res.status,
    headers: res.headers,
  } as T;
};
