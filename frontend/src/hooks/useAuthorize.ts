import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@/api/generated/schemas";
import { checkPermission } from "@/lib/permissions";
import { Route } from "../routes/_app";

export function useAuthorize(
  permission?: Permission,
  options?: Omit<Parameters<typeof useQuery>[1], "queryKey">,
) {
  const { session } = Route.useRouteContext();
  const enabled = !!session && !!permission;

  const { data, ...rest } = useQuery({
    ...options,
    queryKey: ["authorize", session, permission?.type, { ...permission }],
    queryFn: () => {
      if (!permission) throw new Error("permission is required");
      return checkPermission(session, permission);
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    enabled,
  });

  return {
    isAllowed: permission ? (data ?? false) : true,
    ...rest,
  };
}
