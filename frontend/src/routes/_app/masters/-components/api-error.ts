import { ApiError } from "@/api/client";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (
    !(error instanceof ApiError) ||
    !error.data ||
    typeof error.data !== "object"
  ) {
    return fallback;
  }
  const data = error.data as { message?: unknown; reasons?: unknown };
  if (typeof data.message === "string" && data.message.length > 0) {
    return data.message;
  }
  if (Array.isArray(data.reasons)) {
    const reasons = data.reasons.filter(
      (reason): reason is string =>
        typeof reason === "string" && reason.length > 0,
    );
    if (reasons.length > 0) return reasons.join(" ");
  }
  return fallback;
}
