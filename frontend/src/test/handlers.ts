import { HttpResponse, http } from "msw";
import { queryClient as appQueryClient } from "@/routes/__root";

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
  appQueryClient.clear();
  appQueryClient.setDefaultOptions({
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  });
}
